import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    requestId?: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class EnvelopeInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseEnvelope<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId =
      (request.headers['x-request-id'] as string) ||
      ((request as unknown as Record<string, unknown>).id as string | undefined);

    return next.handle().pipe(
      map((res) => {
        // Skip envelope if response already contains data & meta or is a stream/raw payload
        if (res && typeof res === 'object' && 'data' in res) {
          if (requestId && res.meta) {
            res.meta.requestId = requestId;
          }
          return res;
        }

        return {
          data: res,
          meta: requestId ? { requestId } : undefined,
        };
      }),
    );
  }
}
