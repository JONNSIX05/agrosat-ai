import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './gateway.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('AgroSat-ApiGateway');
  const app = await NestFactory.create(ApiGatewayModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  const port = Number(process.env.PORT ?? 18080);
  await app.listen(port, '0.0.0.0');
  logger.log(
    `🌐 AgroSat AI Unified API Gateway & Web GIS Dashboard escuchando en puerto ${port}`,
  );
}

void bootstrap();
