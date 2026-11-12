import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AlertDomainExceptionFilter } from './infrastructure/filters/alert-domain-exception.filter';
import { Ms5AlertNotificationModule } from './ms5.module';

async function bootstrap() {
  const logger = new Logger('MS5-AlertNotificationService');
  const app = await NestFactory.create(Ms5AlertNotificationModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalFilters(new AlertDomainExceptionFilter());

  const port = Number(process.env.PORT ?? process.env.MS5_PORT ?? 3005);
  await app.listen(port, '0.0.0.0');
  logger.log(
    `🚨 MS5 Alert Notification Service (Watermelon Rule Engine + n8n Webhook) escuchando en puerto ${port}`,
  );
}

void bootstrap();
