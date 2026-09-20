import { createZodDto } from 'nestjs-zod';
import { createRoomSchema, updateRoomSchema, queryRoomSchema } from '@clinicos/shared';

export class CreateRoomDto extends createZodDto(createRoomSchema) {}
export class UpdateRoomDto extends createZodDto(updateRoomSchema) {}
export class QueryRoomDto extends createZodDto(queryRoomSchema) {}
