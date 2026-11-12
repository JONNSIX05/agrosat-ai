import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SeedWatermelonKnowledgeUseCase } from '../../application/use-cases/seed-watermelon-knowledge.use-case';

@Injectable()
export class KnowledgeBaseAutoSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(KnowledgeBaseAutoSeederService.name);

  constructor(private readonly seedKnowledgeUseCase: SeedWatermelonKnowledgeUseCase) {}

  public async onApplicationBootstrap(): Promise<void> {
    try {
      this.logger.log(
        '🍉 Inicializando base de conocimiento agronómico de sandía en pgvector (VECTOR 384)...',
      );
      const result = await this.seedKnowledgeUseCase.execute({ forceReindex: false });
      this.logger.log(
        `✅ Corpus RAG de sandía listo: ${result.totalDocumentsProcessed} documentos activos (${result.embeddingModel}) en ${result.elapsedTimeMs}ms.`,
      );
    } catch (err) {
      this.logger.warn(
        `⚠️ Advertencia en auto-seeding inicial de MS4: ${(err as Error).message}`,
      );
    }
  }
}
