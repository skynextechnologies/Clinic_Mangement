import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { Prisma, Role } from '@prisma/client';
import * as crypto from 'crypto';
import argon2 from 'argon2';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    branchId?: string;
    departmentId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.roles = {
        some: { role: query.role as Role },
      };
    }

    if (query.branchId) {
      where.branches = {
        some: { branchId: query.branchId },
      };
    }

    if (query.departmentId) {
      where.departments = {
        some: { departmentId: query.departmentId },
      };
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.sortOrder || 'asc' }
      : { createdAt: 'desc' };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          roles: { select: { role: true } },
          branches: {
            select: {
              isPrimary: true,
              branch: { select: { id: true, name: true, code: true } },
            },
          },
          departments: {
            select: {
              department: { select: { id: true, name: true } },
            },
          },
          staffProfile: {
            select: {
              specialty: true,
              licenseNo: true,
              isPublic: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const items = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      firstName: u.firstName,
      lastName: u.lastName,
      fullName: `${u.firstName} ${u.lastName}`,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      roles: u.roles.map((r: any) => r.role),
      branches: u.branches.map((b: any) => ({
        id: b.branch.id,
        name: b.branch.name,
        code: b.branch.code,
        isPrimary: b.isPrimary,
      })),
      departments: u.departments.map((d: any) => ({
        id: d.department.id,
        name: d.department.name,
      })),
      specialty: u.staffProfile?.specialty || null,
      licenseNo: u.staffProfile?.licenseNo || null,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        isActive: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        roles: { select: { role: true } },
        branches: {
          select: {
            isPrimary: true,
            branch: { select: { id: true, name: true, code: true } },
          },
        },
        departments: {
          select: {
            department: { select: { id: true, name: true } },
          },
        },
        staffProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Staff user with ID '${id}' not found`);
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      isActive: user.isActive,
      twoFactorEnabled: user.twoFactorEnabled,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map((r: any) => r.role),
      branches: user.branches.map((b: any) => ({
        id: b.branch.id,
        name: b.branch.name,
        code: b.branch.code,
        isPrimary: b.isPrimary,
      })),
      departments: user.departments.map((d: any) => ({
        id: d.department.id,
        name: d.department.name,
      })),
      staffProfile: user.staffProfile,
    };
  }

  async inviteStaff(
    dto: { email: string; roles: string[]; branchIds: string[] },
    actorId?: string,
  ) {
    const emailLower = dto.email.toLowerCase();

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: emailLower },
    });
    if (existingUser) {
      throw new ConflictException(`User with email '${dto.email}' already exists`);
    }

    // Check if active pending invitation exists
    const existingInvite = await this.prisma.invitation.findFirst({
      where: {
        email: emailLower,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingInvite) {
      throw new ConflictException(`Active invitation already exists for '${dto.email}'`);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    const invitation = await this.prisma.invitation.create({
      data: {
        email: emailLower,
        roles: dto.roles,
        branchIds: dto.branchIds,
        tokenHash,
        expiresAt,
      },
    });

    this.logger.log(`Created invitation ${invitation.id} for ${emailLower}. Token: ${rawToken}`);

    await this.prisma.auditLog.create({
      data: {
        action: 'STAFF_INVITED',
        entity: 'invitation',
        entityId: invitation.id,
        actorId: actorId || null,
        after: { email: emailLower, roles: dto.roles, branchIds: dto.branchIds },
      },
    });

    return {
      message: 'Staff invitation created successfully',
      invitationId: invitation.id,
      token: rawToken, // Exposed so caller/tests can send/verify
    };
  }

  async acceptInvitation(dto: {
    token: string;
    firstName: string;
    lastName: string;
    password: string;
    phone?: string;
  }) {
    try {
      const tokenHash = this.hashToken(dto.token);

      const invitation = await this.prisma.invitation.findFirst({
        where: {
          tokenHash,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!invitation) {
        throw new BadRequestException('Invalid or expired invitation token');
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email: invitation.email },
      });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const passwordHash = await argon2.hash(dto.password);
      const roles = invitation.roles as Role[];
      const branchIds = invitation.branchIds as string[];

      const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
          data: {
            email: invitation.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone || null,
            passwordHash,
            isActive: true,
            mustChangePassword: false,
          },
        });

        // Assign roles
        for (const role of roles) {
          await tx.userRole.create({
            data: { userId: user.id, role },
          });
        }

        // Assign branches
        for (let i = 0; i < branchIds.length; i++) {
          await tx.userBranch.create({
            data: {
              userId: user.id,
              branchId: branchIds[i]!,
              isPrimary: i === 0,
            },
          });
        }

        // If clinical role, initialize staff profile
        const clinicalRoles: Role[] = [Role.DOCTOR, Role.NURSE, Role.LAB_TECH, Role.PHARMACIST];
        if (roles.some((r) => clinicalRoles.includes(r))) {
          await tx.staffProfile.create({
            data: {
              userId: user.id,
              isPublic: true,
            },
          });
        }

        // Mark invitation accepted
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        });

        return user;
      });

      return {
        id: result.id,
        message: 'Invitation accepted successfully. You may now log in.',
        userId: result.id,
        email: result.email,
      };
    } catch (err: any) {
      process.stderr.write(
        `\n[ACCEPT INVITATION EXCEPTION] ${err?.stack || err?.message || err}\n`,
      );
      throw err;
    }
  }

  async updateUser(
    id: string,
    dto: {
      firstName?: string;
      lastName?: string;
      phone?: string | null;
      roles?: string[];
      branchIds?: string[];
      departmentIds?: string[];
    },
    actorId?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Staff user with ID '${id}' not found`);
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update basic fields
      await tx.user.update({
        where: { id },
        data: {
          ...(dto.firstName && { firstName: dto.firstName }),
          ...(dto.lastName && { lastName: dto.lastName }),
          ...(dto.phone !== undefined && { phone: dto.phone || null }),
        },
      });

      // Update roles if provided
      if (dto.roles) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        for (const role of dto.roles) {
          await tx.userRole.create({
            data: { userId: id, role: role as Role },
          });
        }
      }

      // Update branches if provided
      if (dto.branchIds) {
        await tx.userBranch.deleteMany({ where: { userId: id } });
        for (let i = 0; i < dto.branchIds.length; i++) {
          await tx.userBranch.create({
            data: {
              userId: id,
              branchId: dto.branchIds[i]!,
              isPrimary: i === 0,
            },
          });
        }
      }

      // Update departments if provided
      if (dto.departmentIds) {
        await tx.staffDepartment.deleteMany({ where: { userId: id } });
        for (const deptId of dto.departmentIds) {
          await tx.staffDepartment.create({
            data: { userId: id, departmentId: deptId },
          });
        }
      }
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'STAFF_UPDATED',
        entity: 'user',
        entityId: id,
        actorId: actorId || null,
        after: dto,
      },
    });

    return this.findOne(id);
  }

  async updateProfile(
    id: string,
    dto: {
      specialty?: string | null;
      qualifications?: string | null;
      licenseNo?: string | null;
      consultationFeeMinor?: number;
      slotMinutes?: number;
      bio?: string | null;
      isPublic?: boolean;
    },
    actorId?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Staff user with ID '${id}' not found`);
    }

    const profile = await this.prisma.staffProfile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        specialty: dto.specialty || null,
        qualifications: dto.qualifications || null,
        licenseNo: dto.licenseNo || null,
        consultationFeeMinor: dto.consultationFeeMinor || 0,
        slotMinutes: dto.slotMinutes || 15,
        bio: dto.bio || null,
        isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
      },
      update: {
        ...(dto.specialty !== undefined && { specialty: dto.specialty || null }),
        ...(dto.qualifications !== undefined && { qualifications: dto.qualifications || null }),
        ...(dto.licenseNo !== undefined && { licenseNo: dto.licenseNo || null }),
        ...(dto.consultationFeeMinor !== undefined && {
          consultationFeeMinor: dto.consultationFeeMinor,
        }),
        ...(dto.slotMinutes !== undefined && { slotMinutes: dto.slotMinutes }),
        ...(dto.bio !== undefined && { bio: dto.bio || null }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'STAFF_PROFILE_UPDATED',
        entity: 'staffProfile',
        entityId: profile.id,
        actorId: actorId || null,
        after: dto,
      },
    });

    return profile;
  }

  async deactivate(id: string, actorId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Staff user with ID '${id}' not found`);
    }

    // Deactivate user and invalidate ALL active sessions for this user!
    const [, revokedSessions] = await Promise.all([
      this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      }),
      this.prisma.session.updateMany({
        where: {
          userId: id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    await this.prisma.auditLog.create({
      data: {
        action: 'USER_DEACTIVATED',
        entity: 'user',
        entityId: id,
        actorId: actorId || null,
        reason: `Deactivated by admin ${actorId}. Revoked ${revokedSessions.count} active sessions.`,
      },
    });

    this.logger.log(`Deactivated user ${id} and revoked ${revokedSessions.count} active sessions.`);

    return {
      id,
      message: 'Staff member deactivated and active sessions revoked',
      userId: id,
      revokedSessionsCount: revokedSessions.count,
    };
  }

  async reactivate(id: string, actorId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Staff user with ID '${id}' not found`);
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'USER_REACTIVATED',
        entity: 'user',
        entityId: id,
        actorId: actorId || null,
      },
    });

    return {
      id,
      message: 'Staff member reactivated successfully',
      userId: id,
    };
  }
}
