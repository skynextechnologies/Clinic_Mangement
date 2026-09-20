import { createZodDto } from 'nestjs-zod';
import {
  inviteStaffSchema,
  acceptInvitationSchema,
  updateStaffUserSchema,
  updateStaffProfileSchema,
  queryStaffSchema,
} from '@clinicos/shared';

export class InviteStaffDto extends createZodDto(inviteStaffSchema) {}
export class AcceptInvitationDto extends createZodDto(acceptInvitationSchema) {}
export class UpdateStaffUserDto extends createZodDto(updateStaffUserSchema) {}
export class UpdateStaffProfileDto extends createZodDto(updateStaffProfileSchema) {}
export class QueryStaffDto extends createZodDto(queryStaffSchema) {}
