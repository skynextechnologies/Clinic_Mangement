import { Controller, Get, Post, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '@clinicos/shared';
import { CreateBranchDto, UpdateBranchDto, QueryBranchDto } from './dto/branches.dto.js';

@Controller('branches')
export class BranchesController {
  constructor(@Inject(BranchesService) private readonly branchesService: BranchesService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.BRANCHES_CREATE)
  async create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.BRANCHES_READ)
  async findAll(@Query() query: QueryBranchDto) {
    return this.branchesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BRANCHES_READ)
  async findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.BRANCHES_UPDATE)
  async update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @RequirePermissions(PERMISSIONS.BRANCHES_UPDATE)
  async deactivate(@Param('id') id: string) {
    return this.branchesService.deactivate(id);
  }
}
