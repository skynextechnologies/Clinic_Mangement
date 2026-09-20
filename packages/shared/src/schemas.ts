import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './constants.js';

export const idSchema = z.string().min(1, 'ID is required');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const e164PhoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g. +1234567890)');

export const moneySchema = z.object({
  amountMinor: z.number().int().min(0, 'Amount must be non-negative'),
  currency: z.string().length(3).default('USD'),
});

export const problemJsonSchema = z.object({
  type: z.string().default('about:blank'),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  code: z.string(),
  errors: z.array(z.record(z.unknown())).optional(),
});

export function createApiEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: z
      .object({
        page: z.number().optional(),
        limit: z.number().optional(),
        total: z.number().optional(),
        requestId: z.string().optional(),
      })
      .optional(),
  });
}

// Branch Schemas
export const createBranchSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase alphanumeric'),
  name: z.string().min(2).max(100),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  timezone: z.string().default('UTC'),
});

export const updateBranchSchema = createBranchSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const queryBranchSchema = paginationSchema.merge(sortSchema).extend({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

// Department Schemas
export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const queryDepartmentSchema = paginationSchema.merge(sortSchema).extend({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

// Room Schemas
export const createRoomSchema = z.object({
  branchId: z.string().min(1, 'Branch ID is required'),
  departmentId: z.string().optional().nullable(),
  name: z.string().min(1).max(100),
  code: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
});

export const updateRoomSchema = createRoomSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const queryRoomSchema = paginationSchema.merge(sortSchema).extend({
  search: z.string().optional(),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

// Staff & Invitation Schemas
export const inviteStaffSchema = z.object({
  email: z.string().email('Invalid email address'),
  roles: z.array(z.string()).min(1, 'At least one role is required'),
  branchIds: z.array(z.string()).min(1, 'At least one branch is required'),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
});

export const updateStaffUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional().nullable(),
  roles: z.array(z.string()).optional(),
  branchIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
});

export const updateStaffProfileSchema = z.object({
  specialty: z.string().optional().nullable(),
  qualifications: z.string().optional().nullable(),
  licenseNo: z.string().optional().nullable(),
  consultationFeeMinor: z.number().int().min(0).optional(),
  slotMinutes: z.number().int().min(5).max(240).optional(),
  bio: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
});

export const queryStaffSchema = paginationSchema.merge(sortSchema).extend({
  search: z.string().optional(),
  role: z.string().optional(),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});
