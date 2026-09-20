import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PERMISSIONS } from '@clinicos/shared';

import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
} from './dto/auth.dto.js';
import {
  Disable2faDto,
  Enable2faDto,
  RegenerateBackupCodesDto,
  Verify2faDto,
} from './dto/totp.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account locked' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const requestId = (req.headers['x-request-id'] as string) || undefined;
    const result = await this.authService.login(dto, req.ip, req.headers['user-agent'], requestId);

    if (result.requires2Factor) {
      return {
        requires2Factor: true,
        tempToken: (result as { tempToken: string }).tempToken,
      };
    }

    const session = result as {
      accessToken: string;
      refreshToken: string;
      user: unknown;
    };

    this.setRefreshCookie(res, session.refreshToken);

    return {
      requires2Factor: false,
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @Public()
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 2FA TOTP code or backup code during step-up login' })
  async verify2fa(
    @Body() dto: Verify2faDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const requestId = (req.headers['x-request-id'] as string) || undefined;
    const result = await this.authService.verify2faLogin(
      dto,
      req.ip,
      req.headers['user-agent'],
      requestId,
    );

    this.setRefreshCookie(res, result.refreshToken!);

    return {
      requires2Factor: false,
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.USERS_READ)
  @ApiBearerAuth()
  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate TOTP secret and QR code URL for 2FA setup' })
  async setup2fa(@CurrentUser('userId') userId: string) {
    return this.authService.setup2fa(userId);
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.USERS_READ)
  @ApiBearerAuth()
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable 2FA with verified TOTP token' })
  async enable2fa(@CurrentUser('userId') userId: string, @Body() dto: Enable2faDto) {
    return this.authService.enable2fa(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.USERS_READ)
  @ApiBearerAuth()
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable 2FA with password confirmation' })
  async disable2fa(@CurrentUser('userId') userId: string, @Body() dto: Disable2faDto) {
    return this.authService.disable2fa(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.USERS_READ)
  @ApiBearerAuth()
  @Post('2fa/backup-codes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate 10 backup codes' })
  async regenerateBackupCodes(
    @CurrentUser('userId') userId: string,
    @Body() dto: RegenerateBackupCodesDto,
  ) {
    return this.authService.regenerateBackupCodes(userId, dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body('refreshToken') bodyRefreshToken?: string,
  ) {
    const refreshToken = req.cookies?.['refreshToken'] || bodyRefreshToken;
    const requestId = (req.headers['x-request-id'] as string) || undefined;

    if (!refreshToken) {
      this.clearRefreshCookie(res);
      return { accessToken: null };
    }

    try {
      const result = await this.authService.refresh(
        refreshToken,
        req.headers['user-agent'],
        req.ip,
        requestId,
      );

      this.setRefreshCookie(res, result.refreshToken);

      return {
        accessToken: result.accessToken,
      };
    } catch (err) {
      this.clearRefreshCookie(res);
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.USERS_READ)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current session' })
  async logout(
    @CurrentUser('sessionId') sessionId: string,
    @CurrentUser('userId') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const requestId = (req.headers['x-request-id'] as string) || undefined;
    if (sessionId) {
      await this.authService.logout(
        sessionId,
        userId,
        req.ip,
        req.headers['user-agent'],
        requestId,
      );
    }
    this.clearRefreshCookie(res);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.USERS_READ)
  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout all active sessions for current user' })
  async logoutAll(
    @CurrentUser('userId') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(userId);
    this.clearRefreshCookie(res);
    return { message: 'All active sessions logged out successfully' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset link' })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const requestId = (req.headers['x-request-id'] as string) || undefined;
    return this.authService.forgotPassword(dto, req.ip, req.headers['user-agent'], requestId);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const requestId = (req.headers['x-request-id'] as string) || undefined;
    return this.authService.resetPassword(dto, req.ip, req.headers['user-agent'], requestId);
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.USERS_READ)
  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password while logged in' })
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    const requestId = (req.headers['x-request-id'] as string) || undefined;
    return this.authService.changePassword(
      userId,
      dto,
      req.ip,
      req.headers['user-agent'],
      requestId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.USERS_READ)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile and claims' })
  async getMe(@CurrentUser('userId') userId: string) {
    return this.authService.getMe(userId);
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.USERS_READ)
  @ApiBearerAuth()
  @Get('sessions')
  @ApiOperation({ summary: 'List active sessions for current user' })
  async getSessions(@CurrentUser('userId') userId: string) {
    return this.authService.getSessions(userId);
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions(PERMISSIONS.USERS_READ)
  @ApiBearerAuth()
  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Revoke specific user session' })
  async revokeSession(@CurrentUser('userId') userId: string, @Param('id') sessionId: string) {
    return this.authService.revokeSession(userId, sessionId);
  }
}
