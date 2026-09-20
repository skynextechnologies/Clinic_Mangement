import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Optional,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(@Optional() private readonly auditService?: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest();

    if (!req) {
      return next.handle();
    }

    const method = req.method;
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (!mutatingMethods.includes(method)) {
      return next.handle();
    }

    const rawPath =
      typeof req.originalUrl === 'string'
        ? req.originalUrl
        : typeof req.url === 'string'
          ? req.url
          : '';
    const cleanPath = rawPath.replace(/^\/api\/v1\//, '').replace(/^\//, '');
    const entity =
      (cleanPath && typeof cleanPath === 'string' ? cleanPath.split('/')[0] : 'system') || 'system';

    return next.handle().pipe(
      tap({
        next: (data) => {
          try {
            if (!this.auditService) return;

            const user = req.user;
            const entityId =
              (data && typeof data === 'object' && 'id' in data
                ? String((data as Record<string, unknown>).id)
                : undefined) ||
              req.params?.id ||
              undefined;

            const requestId =
              req.headers && req.headers['x-request-id']
                ? String(req.headers['x-request-id'])
                : req.requestId || undefined;

            this.auditService
              .record({
                actorId: user?.id,
                actorRole: user?.role,
                action: `HTTP_${method}`,
                entity,
                entityId,
                after: data ? sanitizeData(data) : undefined,
                ip: req.ip || (req.socket && req.socket.remoteAddress),
                userAgent: req.headers ? (req.headers['user-agent'] as string) : undefined,
                requestId,
              })
              .catch(() => {
                // Ignore audit recording failure
              });
          } catch {
            // Guard against any interceptor failure
          }
        },
      }),
    );
  }
}

function sanitizeData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) return data;
  try {
    const jsonStr = JSON.stringify(data, (key, value) => {
      if (
        [
          'password',
          'passwordHash',
          'token',
          'refreshToken',
          'secret',
          'twoFactorSecretEnc',
        ].includes(key)
      ) {
        return undefined;
      }
      return value;
    });
    return JSON.parse(jsonStr);
  } catch {
    return undefined;
  }
}
