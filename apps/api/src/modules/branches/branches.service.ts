import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class BranchesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(data: {
    code: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    timezone?: string;
  }) {
    const existing = await this.prisma.branch.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new ConflictException(`Branch with code '${data.code}' already exists`);
    }

    return this.prisma.branch.create({
      data: {
        code: data.code,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email || null,
        timezone: data.timezone || 'UTC',
      },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BranchWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const orderBy: Prisma.BranchOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.sortOrder || 'asc' }
      : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.branch.count({ where }),
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
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        rooms: true,
      },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID '${id}' not found`);
    }
    return branch;
  }

  async update(
    id: string,
    data: {
      code?: string;
      name?: string;
      address?: string;
      phone?: string;
      email?: string;
      timezone?: string;
      isActive?: boolean;
    },
  ) {
    await this.findOne(id);
    if (data.code) {
      const existing = await this.prisma.branch.findFirst({
        where: { code: data.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Branch with code '${data.code}' already exists`);
      }
    }

    return this.prisma.branch.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.name && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.timezone && { timezone: data.timezone }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deactivate(id: string) {
    return this.update(id, { isActive: false });
  }
}
