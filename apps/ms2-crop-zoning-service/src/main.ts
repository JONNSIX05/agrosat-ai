import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ZoningDomainExceptionFilter } from './infrastructure/filters/domain-exception.filter';
import { Ms2CropZoningModule } from './ms2.module';

async function bootstrap() {
  const logger = new Logger('MS2-CropZoningService');
  const app = await NestFactory.create(Ms2CropZoningModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalFilters(new ZoningDomainExceptionFilter());

  const port = Number(process.env.PORT ?? process.env.MS2_PORT ?? 3002);
  await app.listen(port, '0.0.0.0');
  logger.log(`🌱 MS2 Crop Zoning Service (PostGIS + Sandía Suitability) escuchando en puerto ${port}`);
}

void bootstrap();
