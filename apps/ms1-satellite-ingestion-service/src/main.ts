import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SatelliteDomainExceptionFilter } from './infrastructure/filters/satellite-domain-exception.filter';
import { Ms1SatelliteIngestionModule } from './ms1.module';

async function bootstrap() {
  const logger = new Logger('MS1-SatelliteIngestionService');
  const app = await NestFactory.create(Ms1SatelliteIngestionModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalFilters(new SatelliteDomainExceptionFilter());

  const port = Number(process.env.PORT ?? process.env.MS1_PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  logger.log(
    `🛰️ MS1 Satellite Ingestion Service (PostGIS ST_SquareGrid + Perlin NDVI/EVI) escuchando en puerto ${port}`,
  );
}

void bootstrap();
