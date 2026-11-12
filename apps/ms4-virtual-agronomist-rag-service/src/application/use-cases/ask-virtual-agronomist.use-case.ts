import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AgronomicConsultationAggregate,
  RetrievedChunkReference,
} from '../../domain/entities/agronomic-consultation.aggregate';
import { PromptBuilderDomainService } from '../../domain/services/prompt-builder.domain-service';
import {
  AgronomistConsultationResponseDto,
  AskVirtualAgronomistRequestDto,
  ConsultByTelegramRequestDto,
} from '../dtos/agronomist-consultation.dto';
import {
  EMBEDDING_GENERATOR_PORT,
  EmbeddingGeneratorPort,
} from '../ports/out/embedding-generator.port';
import {
  LLM_COMPLETION_PORT,
  LlmCompletionPort,
} from '../ports/out/llm-completion.port';
import {
  MICROSERVICES_CONTEXT_PORT,
  MicroservicesContextPort,
} from '../ports/out/microservices-context.port';
import {
  VECTOR_STORE_REPOSITORY_PORT,
  VectorStoreRepositoryPort,
} from '../ports/out/vector-store-repository.port';

@Injectable()
export class AskVirtualAgronomistUseCase {
  private readonly logger = new Logger(AskVirtualAgronomistUseCase.name);

  constructor(
    @Inject(EMBEDDING_GENERATOR_PORT)
    private readonly embeddingGenerator: EmbeddingGeneratorPort,
    @Inject(VECTOR_STORE_REPOSITORY_PORT)
    private readonly vectorStoreRepo: VectorStoreRepositoryPort,
    @Inject(MICROSERVICES_CONTEXT_PORT)
    private readonly microservicesContext: MicroservicesContextPort,
    @Inject(LLM_COMPLETION_PORT)
    private readonly llmCompletion: LlmCompletionPort,
    private readonly promptBuilder: PromptBuilderDomainService,
  ) {}

  public async execute(
    dto: AskVirtualAgronomistRequestDto,
  ): Promise<AgronomistConsultationResponseDto> {
    const totalStartMs = Date.now();
    const parcelId =
      dto.parcelId ?? process.env.DEFAULT_PARCEL_ID ?? '00000000-0000-0000-0000-000000000001';
    const topK = Math.min(Math.max(Number(dto.topK ?? 3), 1), 6);

    // 1. En paralelo: generar embedding 384d de la consulta + ensamblar contexto MS1/MS2/MS3
    const [embeddingResult, assembledContext] = await Promise.all([
      this.embeddingGenerator.embedQuery(dto.question),
      this.microservicesContext.assembleParcelContext(parcelId),
    ]);

    // 2. Recuperar top-K fragmentos relevantes en pgvector usando distancia coseno (<=>)
    const retrievedEntities = await this.vectorStoreRepo.searchSimilarChunks({
      queryVector: embeddingResult.vector,
      topK,
    });

    // 3. Construir prompts y respaldo determinista estructurado
    const systemPrompt = this.promptBuilder.buildSystemPrompt();
    const userPrompt = this.promptBuilder.buildConsultationUserPrompt({
      question: dto.question,
      context: assembledContext,
      retrievedChunks: retrievedEntities,
    });
    const fallbackSynthesis = this.promptBuilder.buildLocalStructuredSynthesisFallback({
      question: dto.question,
      context: assembledContext,
      retrievedChunks: retrievedEntities,
    });

    // 4. Invocar DeepSeek API (o respaldo RAG estructurado si no hay API key)
    const llmResult = await this.llmCompletion.generateCompletion({
      systemPrompt,
      userPrompt,
      maxTokens: 1400,
      temperature: 0.25,
      fallbackContent: fallbackSynthesis,
    });

    const retrievedReferences: RetrievedChunkReference[] = retrievedEntities.map((chunk) => ({
      documentCode: chunk.documentCode,
      title: chunk.title,
      category: chunk.category,
      phenologicalStage: chunk.phenologicalStage,
      similarityScore: Number((chunk.similarityScore ?? 0).toFixed(4)),
      excerpt:
        chunk.content.length > 220 ? `${chunk.content.slice(0, 220)}...` : chunk.content,
    }));

    // 5. Persistir bitácora de consulta en ms4_rag.consultation_logs
    const consultationAggregate = AgronomicConsultationAggregate.create({
      parcelId,
      farmerQuestion: dto.question,
      assembledContext,
      retrievedChunks: retrievedReferences,
      deepseekAnswer: llmResult.content,
      modelUsed: llmResult.modelUsed,
      embeddingTimeMs: embeddingResult.elapsedMs,
      llmTimeMs: llmResult.elapsedMs,
    });

    const saved = await this.vectorStoreRepo.saveConsultationLog(consultationAggregate);
    const totalTimeMs = Date.now() - totalStartMs;

    this.logger.log(
      `🧠 Consulta RAG completada para parcela ${parcelId} en ${totalTimeMs}ms (ONNX=${embeddingResult.elapsedMs}ms, LLM=${llmResult.elapsedMs}ms, topChunk=${retrievedReferences[0]?.documentCode ?? 'none'})`,
    );

    return {
      consultationId: saved.id,
      parcelId: saved.parcelId,
      question: saved.farmerQuestion,
      answer: saved.deepseekAnswer,
      answerMarkdown: saved.deepseekAnswer,
      retrievedChunks: saved.retrievedChunks,
      assembledContext: saved.assembledContext,
      metrics: {
        embeddingTimeMs: saved.embeddingTimeMs,
        llmTimeMs: saved.llmTimeMs,
        totalTimeMs,
        embeddingModel: embeddingResult.modelName,
        llmModel: saved.modelUsed,
      },
      createdAt: saved.createdAt.toISOString(),
    };
  }

  public async executeByTelegram(
    dto: ConsultByTelegramRequestDto,
  ): Promise<AgronomistConsultationResponseDto> {
    const parcelId = await this.microservicesContext.resolveParcelIdByTelegramChatId(
      dto.telegramChatId,
    );
    return this.execute({
      parcelId,
      question: dto.question,
      topK: dto.topK ?? 3,
    });
  }
}
