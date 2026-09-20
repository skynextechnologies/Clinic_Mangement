import { createZodDto } from 'nestjs-zod';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  queryDepartmentSchema,
} from '@clinicos/shared';

export class CreateDepartmentDto extends createZodDto(createDepartmentSchema) {}
export class UpdateDepartmentDto extends createZodDto(updateDepartmentSchema) {}
export class QueryDepartmentDto extends createZodDto(queryDepartmentSchema) {}
