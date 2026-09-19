import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';

import { validateConfig } from './common/config/config.schema.js';
import { ProblemJsonFilter } from './common/filters/problem-json.filter.js';
import { EnvelopeInterceptor } from './common/interceptors/envelope.interceptor.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateConfig,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        redact: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.pin'],
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    HealthModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: ProblemJsonFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: EnvelopeInterceptor,
    },
  ],
})
export class AppModule {}
