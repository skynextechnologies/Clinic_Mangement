import { Controller, Get, Post, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { RoomsService } from './rooms.service.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { PERMISSIONS } from '@clinicos/shared';
import { CreateRoomDto, UpdateRoomDto, QueryRoomDto } from './dto/rooms.dto.js';

@Controller('rooms')
export class RoomsController {
  constructor(@Inject(RoomsService) private readonly roomsService: RoomsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.BRANCHES_CREATE)
  async create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.BRANCHES_READ)
  async findAll(@Query() query: QueryRoomDto) {
    return this.roomsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BRANCHES_READ)
  async findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.BRANCHES_UPDATE)
  async update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @RequirePermissions(PERMISSIONS.BRANCHES_UPDATE)
  async deactivate(@Param('id') id: string) {
    return this.roomsService.deactivate(id);
  }
}
