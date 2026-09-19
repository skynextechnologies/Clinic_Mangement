import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  getLiveness() {
    return { status: 'up', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Application dependencies ready' })
  getReadiness() {
    // Scaffold ready status - expanded in T-005 with Prisma & Redis ping
    return {
      status: 'ready',
      database: 'connected',
      redis: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
