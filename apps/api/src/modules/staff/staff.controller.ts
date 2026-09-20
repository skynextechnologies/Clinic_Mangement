import { Controller, Get, Post, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { StaffService } from './staff.service.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PERMISSIONS } from '@clinicos/shared';
import {
  InviteStaffDto,
  AcceptInvitationDto,
  UpdateStaffUserDto,
  UpdateStaffProfileDto,
  QueryStaffDto,
} from './dto/staff.dto.js';

@Controller('staff')
export class StaffController {
  constructor(@Inject(StaffService) private readonly staffService: StaffService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USERS_READ)
  async findAll(@Query() query: QueryStaffDto) {
    return this.staffService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USERS_READ)
  async findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Post('invite')
  @RequirePermissions(PERMISSIONS.USERS_CREATE)
  async inviteStaff(@Body() dto: InviteStaffDto, @CurrentUser('userId') actorId: string) {
    return this.staffService.inviteStaff(dto, actorId);
  }

  @Public()
  @Post('invitations/accept')
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.staffService.acceptInvitation(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.USERS_UPDATE)
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateStaffUserDto,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.staffService.updateUser(id, dto, actorId);
  }

  @Patch(':id/profile')
  @RequirePermissions(PERMISSIONS.USERS_UPDATE)
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateStaffProfileDto,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.staffService.updateProfile(id, dto, actorId);
  }

  @Post(':id/deactivate')
  @RequirePermissions(PERMISSIONS.USERS_DELETE)
  async deactivate(@Param('id') id: string, @CurrentUser('userId') actorId: string) {
    return this.staffService.deactivate(id, actorId);
  }

  @Post(':id/reactivate')
  @RequirePermissions(PERMISSIONS.USERS_UPDATE)
  async reactivate(@Param('id') id: string, @CurrentUser('userId') actorId: string) {
    return this.staffService.reactivate(id, actorId);
  }
}
