import { createZodDto } from 'nestjs-zod';
import { createBranchSchema, updateBranchSchema, queryBranchSchema } from '@clinicos/shared';

export class CreateBranchDto extends createZodDto(createBranchSchema) {}
export class UpdateBranchDto extends createZodDto(updateBranchSchema) {}
export class QueryBranchDto extends createZodDto(queryBranchSchema) {}
