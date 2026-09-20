import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import jwt from 'jsonwebtoken';

import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly reflector: Reflector;

  constructor(
    @Inject(Reflector) reflector: Reflector,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    this.reflector = reflector || new Reflector();
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication credentials missing or invalid');
    }

    const token = authHeader.substring(7);
    const jwtSecret = this.configService.get<string>('JWT_ACCESS_SECRET')!;

    try {
      const payload = jwt.verify(token, jwtSecret) as Record<string, unknown>;
      request.user = {
        id: payload.sub as string,
        userId: payload.sub as string,
        email: payload.email as string,
        role: Array.isArray(payload.roles) ? payload.roles[0] : (payload.role as string),
        roles: (payload.roles as string[]) || [],
        branchIds: (payload.branchIds as string[]) || [],
        sessionId: payload.sid as string,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
