import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { Prisma } from '@prisma/client';

export interface CreateAuditInput {
  actorId?: string;
  actorRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
  reason?: string;
  requestId?: string;
}

export interface AuditQueryInput {
  actorId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async record(input: CreateAuditInput) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        actorRole: input.actorRole,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        before: input.before ? (input.before as Prisma.InputJsonValue) : undefined,
        after: input.after ? (input.after as Prisma.InputJsonValue) : undefined,
        ip: input.ip,
        userAgent: input.userAgent,
        reason: input.reason,
        requestId: input.requestId,
      },
    });
  }

  async findAll(query: AuditQueryInput) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (query.actorId) where.actorId = query.actorId;
    if (query.action) where.action = query.action;
    if (query.entity) where.entity = query.entity;
    if (query.entityId) where.entityId = query.entityId;

    if (query.fromDate || query.toDate) {
      where.at = {};
      if (query.fromDate) where.at.gte = new Date(query.fromDate);
      if (query.toDate) where.at.lte = new Date(query.toDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
