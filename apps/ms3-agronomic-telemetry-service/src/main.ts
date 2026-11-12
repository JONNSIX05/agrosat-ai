import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TelemetryDomainExceptionFilter } from './infrastructure/filters/telemetry-domain-exception.filter';
import { Ms3AgronomicTelemetryModule } from './ms3.module';

async function bootstrap() {
  const logger = new Logger('MS3-AgronomicTelemetryService');
  const app = await NestFactory.create(Ms3AgronomicTelemetryModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalFilters(new TelemetryDomainExceptionFilter());

  const port = Number(process.env.PORT ?? process.env.MS3_PORT ?? 3003);
  await app.listen(port, '0.0.0.0');
  logger.log(
    `🌡️💧 MS3 Agronomic Telemetry Service (20cm/40cm Soil Moisture + VPD) escuchando en puerto ${port}`,
  );
}

void bootstrap();
