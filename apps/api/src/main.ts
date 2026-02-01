import 'dotenv/config';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module.js';
import { RequestIdMiddleware } from './middleware/request-id.middleware.js';
import { initTelemetry } from './telemetry.js';
import { getEnv, validateEnv } from './config/env.js';
import { buildCorsOptions } from './config/cors.js';

initTelemetry('corallo-api');

async function bootstrap() {
  validateEnv();
  const env = getEnv();
  const app = await NestFactory.create(AppModule, { cors: buildCorsOptions(env) });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  app.use(new RequestIdMiddleware().use);
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}

bootstrap();
