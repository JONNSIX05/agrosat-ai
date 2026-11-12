import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  AskVirtualAgronomistRequestDto,
  ConsultByTelegramRequestDto,
  EmergencyBriefRequestDto,
} from '../../application/dtos/agronomist-consultation.dto';
import {
  EMBEDDING_GENERATOR_PORT,
  EmbeddingGeneratorPort,
} from '../../application/ports/out/embedding-generator.port';
import {
  VECTOR_STORE_REPOSITORY_PORT,
  VectorStoreRepositoryPort,
} from '../../application/ports/out/vector-store-repository.port';
import { AskVirtualAgronomistUseCase } from '../../application/use-cases/ask-virtual-agronomist.use-case';
import { GenerateEmergencyBriefUseCase } from '../../application/use-cases/generate-emergency-brief.use-case';
import { SeedWatermelonKnowledgeUseCase } from '../../application/use-cases/seed-watermelon-knowledge.use-case';

@Controller()
export class VirtualAgronomistController {
  constructor(
    private readonly askAgronomistUseCase: AskVirtualAgronomistUseCase,
    private readonly emergencyBriefUseCase: GenerateEmergencyBriefUseCase,
    private readonly seedKnowledgeUseCase: SeedWatermelonKnowledgeUseCase,
    @Inject(EMBEDDING_GENERATOR_PORT)
    private readonly embeddingGenerator: EmbeddingGeneratorPort,
    @Inject(VECTOR_STORE_REPOSITORY_PORT)
    private readonly vectorStoreRepo: VectorStoreRepositoryPort,
  ) {}

  @Get('health')
  public async healthCheck() {
    const indexedChunksCount = await this.vectorStoreRepo.countKnowledgeChunks();
    const modelStatus = this.embeddingGenerator.getModelStatus();
    return {
      service: 'ms4-virtual-agronomist-rag-service',
      status: 'ok',
      embeddingModel: modelStatus.modelName,
      onnxLoaded: modelStatus.isLoaded,
      runtime: modelStatus.runtime,
      indexedChunksCount,
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // ENDPOINTS PÚBLICOS DEL AGRÓNOMO VIRTUAL (Consumidos por Gateway y n8n Bot)
  // ==========================================================================

  @Post('api/v1/agronomist/consult')
  @HttpCode(HttpStatus.OK)
  public async consultAgronomist(@Body() body: AskVirtualAgronomistRequestDto) {
    return this.askAgronomistUseCase.execute(body);
  }

  @Post('api/v1/agronomist/consult-by-telegram')
  @HttpCode(HttpStatus.OK)
  public async consultByTelegram(@Body() body: ConsultByTelegramRequestDto) {
    return this.askAgronomistUseCase.executeByTelegram(body);
  }

  @Post('api/v1/agronomist/seed-knowledge')
  @HttpCode(HttpStatus.OK)
  public async seedWatermelonKnowledge(@Body() body?: { forceReindex?: boolean }) {
    return this.seedKnowledgeUseCase.execute({
      forceReindex: Boolean(body?.forceReindex ?? true),
    });
  }

  @Get('api/v1/agronomist/knowledge-stats')
  public async getKnowledgeStats() {
    const [totalChunks, chunks] = await Promise.all([
      this.vectorStoreRepo.countKnowledgeChunks(),
      this.vectorStoreRepo.listKnowledgeChunksSummary(),
    ]);
    return {
      totalChunks,
      embeddingDimensions: 384,
      modelStatus: this.embeddingGenerator.getModelStatus(),
      chunks,
    };
  }

  @Get('api/v1/agronomist/parcels/:parcelId/history')
  public async getConsultationHistory(
    @Param('parcelId') parcelId: string,
    @Query('limit') limit?: string,
  ) {
    const history = await this.vectorStoreRepo.listConsultationHistory(
      parcelId,
      limit ? Number(limit) : 15,
    );
    return {
      parcelId,
      total: history.length,
      consultations: history.map((item) => ({
        consultationId: item.id,
        parcelId: item.parcelId,
        question: item.farmerQuestion,
        answer: item.deepseekAnswer,
        retrievedChunks: item.retrievedChunks,
        modelUsed: item.modelUsed,
        embeddingTimeMs: item.embeddingTimeMs,
        llmTimeMs: item.llmTimeMs,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  // ==========================================================================
  // ENDPOINT INTERNO DE EMERGENCIA (Consumido por n8n en Alertas Críticas)
  // ==========================================================================

  @Post('internal/v1/agronomist/emergency-brief')
  @HttpCode(HttpStatus.OK)
  public async generateEmergencyBrief(@Body() body: EmergencyBriefRequestDto) {
    return this.emergencyBriefUseCase.execute(body);
  }

  @Post('api/v1/agronomist/emergency-brief')
  @HttpCode(HttpStatus.OK)
  public async generateEmergencyBriefPublicAlias(@Body() body: EmergencyBriefRequestDto) {
    return this.emergencyBriefUseCase.execute(body);
  }
}
