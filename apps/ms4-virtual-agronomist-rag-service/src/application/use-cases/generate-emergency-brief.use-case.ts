import { Inject, Injectable, Logger } from '@nestjs/common';
import { PromptBuilderDomainService } from '../../domain/services/prompt-builder.domain-service';
import {
  EmergencyBriefRequestDto,
  EmergencyBriefResponseDto,
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
export class GenerateEmergencyBriefUseCase {
  private readonly logger = new Logger(GenerateEmergencyBriefUseCase.name);

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

  public async execute(dto: EmergencyBriefRequestDto): Promise<EmergencyBriefResponseDto> {
    const parcelId =
      dto.parcelId ?? process.env.DEFAULT_PARCEL_ID ?? '00000000-0000-0000-0000-000000000001';
    const ruleCode = dto.ruleCode || 'WATERMELON_CRITICAL_ANOMALY';
    const metrics = dto.metrics ?? {};

    const searchPhraseMap: Record<string, string> = {
      FROST_ALERT:
        'protocolo de emergencia por helada temperatura menor a 4 grados en sandía riego nocturno aminoácidos',
      HEAT_AND_DROUGHT_SHOCK:
        'golpe de calor mayor a 38 grados y sequía humedad de suelo menor a 25% en floración cuajado sandía calcio boro',
      SUDDEN_NDVI_DROP:
        'caída abrupta de índice NDVI mancha de estrés hídrico fusarium o araña roja en sandía revisión de cintilla',
    };

    const queryText =
      searchPhraseMap[ruleCode] ??
      `emergencia agronómica ${ruleCode} en cultivo de sandía ${JSON.stringify(metrics)}`;

    const [embeddingResult, context] = await Promise.all([
      this.embeddingGenerator.embedQuery(queryText),
      this.microservicesContext.assembleParcelContext(parcelId),
    ]);

    const chunks = await this.vectorStoreRepo.searchSimilarChunks({
      queryVector: embeddingResult.vector,
      topK: 1,
    });
    const topChunk = chunks[0];

    const { systemPrompt, userPrompt } = this.promptBuilder.buildEmergencyBriefPrompt({
      parcelId,
      ruleCode,
      metrics,
      defaultAction: dto.defaultAction,
      context,
      topChunk,
    });

    const fallbackParagraph = topChunk
      ? `${dto.defaultAction ? `${dto.defaultAction} ` : ''}Según el protocolo [${topChunk.documentCode}] (${topChunk.title}), mantenga el bulbo radicular húmedo a 20 cm y verifique de inmediato la presión de cintillas y el balance transpiratorio del lote.`
      : dto.defaultAction ??
        'Active de inmediato un pulso correctivo de riego por goteo para estabilizar el bulbo radicular a 20 cm y supervise síntomas en guías principales.';

    const llmResult = await this.llmCompletion.generateCompletion({
      systemPrompt,
      userPrompt,
      maxTokens: 200,
      temperature: 0.2,
      fallbackContent: fallbackParagraph,
    });

    this.logger.log(
      `🚨 Brief de emergencia generado para alerta ${ruleCode} en parcela ${parcelId} (${llmResult.elapsedMs}ms)`,
    );

    return {
      parcelId,
      ruleCode,
      emergencyParagraph: llmResult.content,
      referencedDocumentCode: topChunk?.documentCode ?? null,
      modelUsed: llmResult.modelUsed,
      llmTimeMs: llmResult.elapsedMs,
    };
  }
}
