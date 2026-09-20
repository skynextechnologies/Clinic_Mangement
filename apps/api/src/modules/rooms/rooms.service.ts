import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(data: {
    branchId: string;
    departmentId?: string | null;
    name: string;
    code?: string | null;
    type?: string | null;
  }) {
    // Verify branch exists
    const branch = await this.prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) {
      throw new NotFoundException(`Branch with ID '${data.branchId}' not found`);
    }

    if (data.departmentId) {
      const dept = await this.prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!dept) {
        throw new NotFoundException(`Department with ID '${data.departmentId}' not found`);
      }
    }

    return this.prisma.room.create({
      data: {
        branchId: data.branchId,
        departmentId: data.departmentId || null,
        name: data.name,
        code: data.code || null,
        type: data.type || null,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    branchId?: string;
    departmentId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.RoomWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { type: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.branchId) {
      where.branchId = query.branchId;
    }
    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const orderBy: Prisma.RoomOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.sortOrder || 'asc' }
      : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          branch: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true } },
        },
      }),
      this.prisma.room.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true } },
      },
    });
    if (!room) {
      throw new NotFoundException(`Room with ID '${id}' not found`);
    }
    return room;
  }

  async update(
    id: string,
    data: {
      branchId?: string;
      departmentId?: string | null;
      name?: string;
      code?: string | null;
      type?: string | null;
      isActive?: boolean;
    },
  ) {
    await this.findOne(id);
    return this.prisma.room.update({
      where: { id },
      data: {
        ...(data.branchId && { branchId: data.branchId }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId || null }),
        ...(data.name && { name: data.name }),
        ...(data.code !== undefined && { code: data.code || null }),
        ...(data.type !== undefined && { type: data.type || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  async deactivate(id: string) {
    return this.update(id, { isActive: false });
  }
}
