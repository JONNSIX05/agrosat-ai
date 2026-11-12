import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { RagDomainExceptionFilter } from './infrastructure/filters/rag-domain-exception.filter';
import { Ms4VirtualAgronomistRagModule } from './ms4.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('MS4-VirtualAgronomistRagService');
  const app = await NestFactory.create(Ms4VirtualAgronomistRagModule);

  app.enableCors();
  app.useGlobalFilters(new RagDomainExceptionFilter());

  const port = Number(process.env.PORT ?? 3004);
  await app.listen(port, '0.0.0.0');
  logger.log(
    `🧠 MS4 Virtual Agronomist RAG Service (ONNX 384d + pgvector + DeepSeek) escuchando en puerto ${port}`,
  );
}

void bootstrap();
