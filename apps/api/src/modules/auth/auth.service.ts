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

import { EncryptionService } from '../../common/crypto/encryption.service.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
} from './dto/auth.dto.js';
import {
  Disable2faDto,
  Enable2faDto,
  RegenerateBackupCodesDto,
  Verify2faDto,
} from './dto/totp.dto.js';
import { TotpService } from './totp.service.js';

// Dummy argon2 hash for timing attack mitigation on invalid email
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$Rzg2ZnMwY29kZWtleTEyMzQ1Njc4OTAxMjM0NQ';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(EncryptionService) private readonly encryptionService: EncryptionService,
    @Inject(TotpService) private readonly totpService: TotpService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Login user with generic credential errors, 5-attempt lockout, and 2FA challenge if enabled
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

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
      throw new UnauthorizedException(
        `Account locked due to 5 consecutive failed login attempts. Please try again in ${minutesLeft} minutes.`,
      );
    }

    const isValidPassword = await argon2.verify(user.passwordHash, dto.password);

    if (!isValidPassword) {
      const failedLoginCount = user.failedLoginCount + 1;
      let lockedUntil: Date | null = null;

      if (failedLoginCount >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
        this.logger.warn(
          `[Lockout Triggered] User ${user.email} locked out until ${lockedUntil.toISOString()}`,
        );
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount,
          lockedUntil,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          entity: 'user',
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

    // Check if 2FA step-up challenge is required
    if (user.twoFactorEnabled) {
      const tempSecret = this.configService.get<string>('JWT_ACCESS_SECRET')!;
      const tempToken = jwt.sign({ sub: user.id, email: user.email, is2faTemp: true }, tempSecret, {
        expiresIn: '5m',
      });

      return {
        requires2Factor: true,
        tempToken,
      };
    }

    return this.completeLoginSession(user, ip, userAgent, requestId);
  }

  /**
   * Completes login session creation and JWT issuance
   */
  private async completeLoginSession(
    user: any,
    ip?: string,
    userAgent?: string,
    requestId?: string,
  ) {
    const roles = user.roles.map((r: any) => r.role);
    const branchIds = user.branches.map((b: any) => b.branchId);

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
        entity: 'user',
        entityId: user.id,
        actorId: user.id,
        actorRole: roles[0],
        ip,
        userAgent,
        requestId,
      },
    });

    return {
      requires2Factor: false,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mustChangePassword: user.mustChangePassword,
        roles,
        branchIds,
      },
    };
  }

  /**
   * Verifies 2FA step-up login token or single-use backup code
   */
  async verify2faLogin(dto: Verify2faDto, ip?: string, userAgent?: string, requestId?: string) {
    const tempSecret = this.configService.get<string>('JWT_ACCESS_SECRET')!;
    let payload: any;

    try {
      payload = jwt.verify(dto.tempToken, tempSecret);
      if (!payload.is2faTemp) {
        throw new Error();
      }
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA session token');
    }

    const userId = payload.sub;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        branches: true,
        backupCodes: { where: { usedAt: null } },
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecretEnc) {
      throw new UnauthorizedException('2FA is not configured for this user');
    }

    const rawSecret = this.encryptionService.decrypt(user.twoFactorSecretEnc);
    const isTotpValid = this.totpService.verifyToken(dto.code, rawSecret);

    if (!isTotpValid) {
      // Check backup code
      const codeHash = this.totpService.hashBackupCode(dto.code);
      const matchingBackupCode = user.backupCodes.find((bc) => bc.codeHash === codeHash);

      if (!matchingBackupCode) {
        throw new UnauthorizedException('Invalid authentication code or backup code');
      }

      // Mark backup code as single-use consumed
      await this.prisma.backupCode.update({
        where: { id: matchingBackupCode.id },
        data: { usedAt: new Date() },
      });
    }

    return this.completeLoginSession(user, ip, userAgent, requestId);
  }

  /**
   * 2FA Setup: Generates TOTP secret and QR code URL
   */
  async setup2fa(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.totpService.generateSecret(user.email);
  }

  /**
   * Enables 2FA for user upon verifying 6-digit TOTP token, stores encrypted secret & backup codes
   */
  async enable2fa(userId: string, dto: Enable2faDto) {
    const isValid = this.totpService.verifyToken(dto.token, dto.secret);
    if (!isValid) {
      throw new BadRequestException('Invalid 6-digit TOTP verification code');
    }

    const encryptedSecret = this.encryptionService.encrypt(dto.secret);
    const { rawCodes, hashedCodes } = this.totpService.generateBackupCodes();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorSecretEnc: encryptedSecret,
        },
      }),
      this.prisma.backupCode.deleteMany({ where: { userId } }),
      this.prisma.backupCode.createMany({
        data: hashedCodes.map((h) => ({
          userId,
          codeHash: h.codeHash,
        })),
      }),
    ]);

    return {
      message: '2FA enabled successfully',
      backupCodes: rawCodes,
    };
  }

  /**
   * Disables 2FA (requires password confirmation)
   */
  async disable2fa(userId: string, dto: Disable2faDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValidPassword = await argon2.verify(user.passwordHash, dto.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecretEnc: null,
        },
      }),
      this.prisma.backupCode.deleteMany({ where: { userId } }),
    ]);

    return { message: '2FA disabled successfully' };
  }

  /**
   * Regenerates 10 backup codes for 2FA-enabled user
   */
  async regenerateBackupCodes(userId: string, dto: RegenerateBackupCodesDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    const isValidPassword = await argon2.verify(user.passwordHash, dto.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid password');
    }

    const { rawCodes, hashedCodes } = this.totpService.generateBackupCodes();

    await this.prisma.$transaction([
      this.prisma.backupCode.deleteMany({ where: { userId } }),
      this.prisma.backupCode.createMany({
        data: hashedCodes.map((h) => ({
          userId,
          codeHash: h.codeHash,
        })),
      }),
    ]);

    return { backupCodes: rawCodes };
  }

  /**
   * Refresh token rotation
   */
  async refresh(refreshToken: string, userAgent?: string, ip?: string, requestId?: string) {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
    let payload: any;

    try {
      payload = jwt.verify(refreshToken, refreshSecret);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { sub: userId, familyId, sid: sessionId, rawToken } = payload;
    const tokenHash = this.hashToken(rawToken);

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: { include: { roles: true, branches: true } } },
    });

    if (!session) {
      throw new UnauthorizedException('Session has been revoked or expired');
    }

    if (session.refreshTokenHash !== tokenHash || session.revokedAt) {
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
          entity: 'session',
          entityId: sessionId,
          actorId: userId,
          ip,
          userAgent,
          requestId,
          reason: `Refresh token reuse attempt on family ${familyId}`,
        },
      });

      throw new UnauthorizedException(
        'Refresh token reuse detected. All sessions in family have been revoked for security.',
      );
    }

    const newRawRefreshToken = crypto.randomBytes(32).toString('hex');
    const newRefreshTokenHash = this.hashToken(newRawRefreshToken);
    const newSessionId = crypto.randomUUID();

    const refreshTtlMs = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + refreshTtlMs);

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
        replacedById: newSessionId,
      },
    });

    await this.prisma.session.create({
      data: {
        id: newSessionId,
        userId,
        familyId,
        refreshTokenHash: newRefreshTokenHash,
        userAgent,
        ip,
        expiresAt,
      },
    });

    const roles = session.user.roles.map((r) => r.role);
    const branchIds = session.user.branches.map((b) => b.branchId);

    const newAccessToken = this.signAccessToken({
      sub: userId,
      email: session.user.email,
      roles,
      branchIds,
      sid: newSessionId,
    });

    const newRefreshToken = this.signRefreshToken({
      sub: userId,
      familyId,
      sid: newSessionId,
      rawToken: newRawRefreshToken,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout current session
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
        entity: 'session',
        entityId: sessionId,
        actorId: userId,
        ip,
        userAgent,
        requestId,
      },
    });
  }

  /**
   * Logout all sessions for user
   */
  async logoutAll(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Request password reset link
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

    if (user && user.isActive) {
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

      this.logger.log(
        `[Password Reset Link] User: ${user.email}, Token: ${rawToken}, Link: ${process.env.APP_URL}/reset-password?token=${rawToken}`,
      );

      await this.prisma.auditLog.create({
        data: {
          action: 'PASSWORD_RESET_REQUESTED',
          entity: 'user',
          entityId: user.id,
          actorId: user.id,
          ip,
          userAgent,
          requestId,
        },
      });

      return {
        message: 'If an account exists with that email, a password reset link has been sent.',
        devToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
      };
    }

    return {
      message: 'If an account exists with that email, a password reset link has been sent.',
    };
  }

  /**
   * Reset password with valid token
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

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash,
          mustChangePassword: false,
          failedLoginCount: 0,
          lockedUntil: null,
        },
      }),
      this.prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.session.updateMany({
        where: { userId: resetRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_COMPLETED',
        entity: 'user',
        entityId: resetRecord.userId,
        actorId: resetRecord.userId,
        ip,
        userAgent,
        requestId,
      },
    });

    return {
      message: 'Password has been reset successfully. Please log in with your new password.',
    };
  }

  /**
   * Change password while logged in
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

    const isValidCurrent = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!isValidCurrent) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          mustChangePassword: false,
        },
      }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.prisma.auditLog.create({
      data: {
        action: 'PASSWORD_CHANGED',
        entity: 'user',
        entityId: userId,
        actorId: userId,
        ip,
        userAgent,
        requestId,
      },
    });

    return { message: 'Password changed successfully. Active sessions have been logged out.' };
  }

  /**
   * GET /auth/me profile
   */
  async getMe(userId: string) {
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
  }

  /**
   * List active sessions for user
   */
  async getSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
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

    return { sessions };
  }

  /**
   * Revoke specific session
   */
  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Session revoked successfully' };
  }

  private signAccessToken(payload: Record<string, unknown>): string {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET')!;
    const ttl = this.configService.get<string>('ACCESS_TTL', '15m');
    return jwt.sign(payload, secret, { expiresIn: ttl as any });
  }

  private signRefreshToken(payload: Record<string, unknown>): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
    const ttl = this.configService.get<string>('REFRESH_TTL', '7d');
    return jwt.sign(payload, secret, { expiresIn: ttl as any });
  }
}
