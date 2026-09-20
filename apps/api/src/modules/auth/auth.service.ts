import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

import { PrismaService } from '../../infra/prisma/prisma.service.js';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
} from './dto/auth.dto.js';

// Dummy argon2 hash for timing attack mitigation on invalid email
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$Rzg2ZnMwY29kZWtleTEyMzQ1Njc4OTAxMjM0NQ';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Login user with generic credential errors, 5-attempt lockout, and session issuance
   */
  async login(dto: LoginDto, ip?: string, userAgent?: string, requestId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        roles: true,
        branches: true,
      },
    });

    if (!user) {
      await argon2.verify(DUMMY_HASH, dto.password).catch(() => {});
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new UnauthorizedException(
        `Account is locked due to multiple failed attempts. Please try again after ${remainingMin} minute(s).`,
      );
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);

    if (!isPasswordValid) {
      const newFailedCount = user.failedLoginCount + 1;
      let lockedUntil: Date | null = null;

      if (newFailedCount >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: newFailedCount,
          lockedUntil,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          action: lockedUntil ? 'LOCKOUT' : 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          actorId: user.id,
          actorRole: user.roles[0]?.role,
          ip,
          userAgent,
          requestId,
          reason: lockedUntil ? '5 failed password attempts' : 'Incorrect password',
        },
      });

      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account has been deactivated');
    }

    // Password valid: reset failed attempts & update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const roles = user.roles.map((r) => r.role);
    const branchIds = user.branches.map((b) => b.branchId);

    // Issue tokens & session
    const familyId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = this.hashToken(rawRefreshToken);

    const refreshTtlMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    const expiresAt = new Date(Date.now() + refreshTtlMs);

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        familyId,
        refreshTokenHash,
        userAgent,
        ip,
        expiresAt,
      },
    });

    const accessToken = this.signAccessToken({
      sub: user.id,
      email: user.email,
      roles,
      branchIds,
      sid: sessionId,
    });

    const refreshToken = this.signRefreshToken({
      sub: user.id,
      familyId,
      sid: sessionId,
      rawToken: rawRefreshToken,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'LOGIN_SUCCESS',
        entity: 'User',
        entityId: user.id,
        actorId: user.id,
        actorRole: roles[0],
        ip,
        userAgent,
        requestId,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mustChangePassword: user.mustChangePassword,
        twoFactorEnabled: user.twoFactorEnabled,
        roles,
        branchIds,
      },
    };
  }

  /**
   * Rotate refresh token with family-id reuse detection
   */
  async refresh(rawRefreshToken: string, userAgent?: string, ip?: string, requestId?: string) {
    let payload: Record<string, unknown>;
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')!;

    try {
      payload = jwt.verify(rawRefreshToken, refreshSecret) as Record<string, unknown>;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const userId = payload.sub as string;
    const familyId = payload.familyId as string;
    const rawTokenSecret = payload.rawToken as string;

    if (!userId || !familyId || !rawTokenSecret) {
      throw new UnauthorizedException('Malformed refresh token payload');
    }

    const refreshTokenHash = this.hashToken(rawTokenSecret);

    const existingSession = await this.prisma.session.findFirst({
      where: { refreshTokenHash },
    });

    // Reuse Detection: Token signed for this family, but token hash does NOT match any active non-revoked session
    if (!existingSession || existingSession.revokedAt != null) {
      this.logger.error(
        `[Security Alert] Refresh token reuse detected for family ${familyId}! Revoking all sessions in family.`,
      );

      await this.prisma.session.updateMany({
        where: { familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await this.prisma.auditLog.create({
        data: {
          action: 'TOKEN_REUSE_DETECTED',
          entity: 'Session',
          actorId: userId,
          ip,
          userAgent,
          requestId,
          reason: `Security alert: Refresh token reuse on family ${familyId}`,
        },
      });

      throw new UnauthorizedException(
        'Security Alert: Refresh token reuse detected. All sessions in family revoked.',
      );
    }

    if (existingSession.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke current session
    const newSessionId = crypto.randomUUID();
    const newRawToken = crypto.randomBytes(32).toString('hex');
    const newRefreshHash = this.hashToken(newRawToken);

    await this.prisma.session.update({
      where: { id: existingSession.id },
      data: {
        revokedAt: new Date(),
        replacedById: newSessionId,
      },
    });

    const refreshTtlMs = 7 * 24 * 60 * 60 * 1000;
    const newExpiresAt = new Date(Date.now() + refreshTtlMs);

    await this.prisma.session.create({
      data: {
        id: newSessionId,
        userId: existingSession.userId,
        familyId: existingSession.familyId,
        refreshTokenHash: newRefreshHash,
        userAgent,
        ip,
        expiresAt: newExpiresAt,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true, branches: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or no longer exists');
    }

    const roles = user.roles.map((r) => r.role);
    const branchIds = user.branches.map((b) => b.branchId);

    const accessToken = this.signAccessToken({
      sub: user.id,
      email: user.email,
      roles,
      branchIds,
      sid: newSessionId,
    });

    const newRefreshToken = this.signRefreshToken({
      sub: user.id,
      familyId: existingSession.familyId,
      sid: newSessionId,
      rawToken: newRawToken,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Revoke single session
   */
  async logout(
    sessionId: string,
    userId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'LOGOUT',
        entity: 'Session',
        entityId: sessionId,
        actorId: userId,
        ip,
        userAgent,
        requestId,
      },
    });
  }

  /**
   * Revoke all user sessions
   */
  async logoutAll(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Forgot password request (single-use token, 1h expiry)
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
    ip?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      return { message: 'If email exists, password reset instructions have been sent.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_REQUEST',
        entity: 'User',
        entityId: user.id,
        actorId: user.id,
        ip,
        userAgent,
        requestId,
      },
    });

    this.logger.log(
      `[Mailpit Reset Email Mock] Password reset link for ${user.email}: token=${rawToken}`,
    );

    return {
      message: 'If email exists, password reset instructions have been sent.',
      devToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
    };
  }

  /**
   * Reset password with single-use token and session revocation
   */
  async resetPassword(dto: ResetPasswordDto, ip?: string, userAgent?: string, requestId?: string) {
    const tokenHash = this.hashToken(dto.token);

    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const newPasswordHash = await argon2.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: resetRecord.userId },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    await this.prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    });

    await this.logoutAll(resetRecord.userId);

    await this.prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_SUCCESS',
        entity: 'User',
        entityId: resetRecord.userId,
        actorId: resetRecord.userId,
        ip,
        userAgent,
        requestId,
      },
    });

    return {
      message: 'Password has been successfully reset. Please log in with your new password.',
    };
  }

  /**
   * Change password logged in
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    ip?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newPasswordHash = await argon2.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    await this.logoutAll(userId);

    await this.prisma.auditLog.create({
      data: {
        action: 'CHANGE_PASSWORD_SUCCESS',
        entity: 'User',
        entityId: userId,
        actorId: userId,
        ip,
        userAgent,
        requestId,
      },
    });

    return {
      message: 'Password successfully changed. Other active sessions have been logged out.',
    };
  }

  /**
   * GET /auth/me profile
   */
  async getMe(userId: string) {
    try {
      if (!userId) {
        throw new BadRequestException(`Invalid userId passed to getMe: ${userId}`);
      }
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          isActive: true,
          mustChangePassword: true,
          twoFactorEnabled: true,
          lastLoginAt: true,
          roles: { select: { role: true } },
          branches: { select: { branchId: true, isPrimary: true } },
          staffProfile: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        ...user,
        roles: user.roles.map((r) => r.role),
        branches: user.branches.map((b) => ({ branchId: b.branchId, isPrimary: b.isPrimary })),
      };
    } catch (err) {
      console.error('ERROR IN getMe:', err);
      throw err;
    }
  }

  /**
   * GET /auth/sessions
   */
  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        userAgent: true,
        ip: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * DELETE /auth/sessions/:id
   */
  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Session successfully revoked' };
  }

  private signAccessToken(payload: Record<string, unknown>): string {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET')!;
    const ttl = this.configService.get<string>('ACCESS_TTL', '15m');
    return jwt.sign(payload, secret, { expiresIn: ttl as unknown as number });
  }

  private signRefreshToken(payload: Record<string, unknown>): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
    const ttl = this.configService.get<string>('REFRESH_TTL', '7d');
    return jwt.sign(payload, secret, { expiresIn: ttl as unknown as number });
  }
}
