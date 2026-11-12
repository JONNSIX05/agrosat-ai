import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@agrosat/shared-kernel';
import { EMBEDDING_GENERATOR_PORT } from './application/ports/out/embedding-generator.port';
import { LLM_COMPLETION_PORT } from './application/ports/out/llm-completion.port';
import { MICROSERVICES_CONTEXT_PORT } from './application/ports/out/microservices-context.port';
import { VECTOR_STORE_REPOSITORY_PORT } from './application/ports/out/vector-store-repository.port';
import { AskVirtualAgronomistUseCase } from './application/use-cases/ask-virtual-agronomist.use-case';
import { GenerateEmergencyBriefUseCase } from './application/use-cases/generate-emergency-brief.use-case';
import { SeedWatermelonKnowledgeUseCase } from './application/use-cases/seed-watermelon-knowledge.use-case';
import { PromptBuilderDomainService } from './domain/services/prompt-builder.domain-service';
import { DeepSeekLlmAdapter } from './infrastructure/adapters/deepseek-llm.adapter';
import { HttpMicroservicesContextAdapter } from './infrastructure/adapters/http-microservices-context.adapter';
import { KnowledgeBaseAutoSeederService } from './infrastructure/adapters/knowledge-base-auto-seeder.service';
import { LocalTransformersEmbeddingAdapter } from './infrastructure/adapters/local-transformers-embedding.adapter';
import { PgvectorKnowledgeRepository } from './infrastructure/adapters/pgvector-knowledge.repository';
import { VirtualAgronomistController } from './infrastructure/controllers/virtual-agronomist.controller';

@Module({
  imports: [PostgresDatabaseModule],
  controllers: [VirtualAgronomistController],
  providers: [
    PromptBuilderDomainService,
    AskVirtualAgronomistUseCase,
    GenerateEmergencyBriefUseCase,
    SeedWatermelonKnowledgeUseCase,
    KnowledgeBaseAutoSeederService,
    {
      provide: EMBEDDING_GENERATOR_PORT,
      useClass: LocalTransformersEmbeddingAdapter,
    },
    {
      provide: VECTOR_STORE_REPOSITORY_PORT,
      useClass: PgvectorKnowledgeRepository,
    },
    {
      provide: LLM_COMPLETION_PORT,
      useClass: DeepSeekLlmAdapter,
    },
    {
      provide: MICROSERVICES_CONTEXT_PORT,
      useClass: HttpMicroservicesContextAdapter,
    },
  ],
})
export class Ms4VirtualAgronomistRagModule {}
