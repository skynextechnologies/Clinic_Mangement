import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ProblemJson {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code: string;
  requestId?: string;
  errors?: unknown[];
}

@Catch()
export class ProblemJsonFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemJsonFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request.headers['x-request-id'] as string) ||
      ((request as unknown as Record<string, unknown>).id as string | undefined);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let code = 'INTERNAL_SERVER_ERROR';
    let detail: string | undefined = undefined;
    let errors: unknown[] | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        detail = res;
        title = exception.name;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        title = (typeof resObj.error === 'string' ? resObj.error : undefined) || exception.name;
        code =
          (typeof resObj.code === 'string' ? resObj.code : undefined) ||
          (typeof resObj.error === 'string' ? resObj.error : undefined) ||
          'BAD_REQUEST';
        detail =
          typeof resObj.message === 'string'
            ? resObj.message
            : Array.isArray(resObj.message)
              ? resObj.message.join('; ')
              : undefined;
        if (Array.isArray(resObj.message)) {
          errors = resObj.message;
        }
      }
    } else if (exception instanceof Error) {
      detail = exception.message;
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    }

    const problemPayload: ProblemJson = {
      type: 'about:blank',
      title,
      status,
      detail,
      instance: request.url,
      code: code.toUpperCase().replace(/\s+/g, '_'),
      requestId,
      ...(errors ? { errors } : {}),
    };

    response.setHeader('Content-Type', 'application/problem+json');
    response.status(status).json(problemPayload);
  }
}
