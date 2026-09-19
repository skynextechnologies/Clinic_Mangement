import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module.js';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);

  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ClinicOS API')
    .setDescription('Production-grade multi-role Clinic Management System API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`ClinicOS API server running on http://localhost:${port}`);
  logger.log(`OpenAPI documentation available at http://localhost:${port}/api/docs`);

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}
