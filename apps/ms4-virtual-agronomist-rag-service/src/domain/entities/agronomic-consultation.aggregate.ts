import { AggregateRoot } from '@agrosat/shared-kernel';
import {
  LatestSatelliteSceneContextDto,
  ParcelSuitabilityContextDto,
  TelemetrySummaryContextDto,
} from '@agrosat/service-contracts';
import { InvalidAgronomicQuestionException } from '../exceptions/rag-domain.exceptions';

export interface AssembledAgronomicContext {
  parcel?: ParcelSuitabilityContextDto | null;
  satellite?: LatestSatelliteSceneContextDto | null;
  telemetry?: TelemetrySummaryContextDto | null;
}

export interface RetrievedChunkReference {
  documentCode: string;
  title: string;
  category: string;
  phenologicalStage: string;
  similarityScore: number;
  excerpt: string;
}

export interface AgronomicConsultationProps {
  parcelId: string;
  farmerQuestion: string;
  assembledContext: AssembledAgronomicContext;
  retrievedChunks: RetrievedChunkReference[];
  deepseekAnswer: string;
  modelUsed: string;
  embeddingTimeMs: number;
  llmTimeMs: number;
  createdAt: Date;
}

export class AgronomicConsultationAggregate extends AggregateRoot<AgronomicConsultationProps> {
  private constructor(props: AgronomicConsultationProps, id?: string) {
    super(props, id);
  }

  public static create(
    params: {
      parcelId: string;
      farmerQuestion: string;
      assembledContext: AssembledAgronomicContext;
      retrievedChunks: RetrievedChunkReference[];
      deepseekAnswer: string;
      modelUsed: string;
      embeddingTimeMs: number;
      llmTimeMs: number;
      createdAt?: Date;
    },
    id?: string,
  ): AgronomicConsultationAggregate {
    const cleanQuestion = (params.farmerQuestion || '').trim();
    if (cleanQuestion.length < 3) {
      throw new InvalidAgronomicQuestionException(
        'La pregunta para el Agrónomo Virtual debe contener al menos 3 caracteres.',
      );
    }

    return new AgronomicConsultationAggregate(
      {
        parcelId: params.parcelId,
        farmerQuestion: cleanQuestion,
        assembledContext: params.assembledContext,
        retrievedChunks: params.retrievedChunks,
        deepseekAnswer: params.deepseekAnswer,
        modelUsed: params.modelUsed,
        embeddingTimeMs: Math.max(0, Math.round(params.embeddingTimeMs)),
        llmTimeMs: Math.max(0, Math.round(params.llmTimeMs)),
        createdAt: params.createdAt ?? new Date(),
      },
      id,
    );
  }

  public get parcelId(): string {
    return this.props.parcelId;
  }

  public get farmerQuestion(): string {
    return this.props.farmerQuestion;
  }

  public get assembledContext(): AssembledAgronomicContext {
    return this.props.assembledContext;
  }

  public get retrievedChunks(): RetrievedChunkReference[] {
    return this.props.retrievedChunks;
  }

  public get deepseekAnswer(): string {
    return this.props.deepseekAnswer;
  }

  public get modelUsed(): string {
    return this.props.modelUsed;
  }

  public get embeddingTimeMs(): number {
    return this.props.embeddingTimeMs;
  }

  public get llmTimeMs(): number {
    return this.props.llmTimeMs;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }
}
