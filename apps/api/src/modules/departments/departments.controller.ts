import { Controller, Get, Post, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { DepartmentsService } from './departments.service.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '@clinicos/shared';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  QueryDepartmentDto,
} from './dto/departments.dto.js';

@Controller('departments')
export class DepartmentsController {
  constructor(
    @Inject(DepartmentsService) private readonly departmentsService: DepartmentsService,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.BRANCHES_CREATE)
  async create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.BRANCHES_READ)
  async findAll(@Query() query: QueryDepartmentDto) {
    return this.departmentsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BRANCHES_READ)
  async findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.BRANCHES_UPDATE)
  async update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @RequirePermissions(PERMISSIONS.BRANCHES_UPDATE)
  async deactivate(@Param('id') id: string) {
    return this.departmentsService.deactivate(id);
  }
}
