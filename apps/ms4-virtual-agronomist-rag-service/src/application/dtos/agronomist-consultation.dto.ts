import {
  AssembledAgronomicContext,
  RetrievedChunkReference,
} from '../../domain/entities/agronomic-consultation.aggregate';

export interface AskVirtualAgronomistRequestDto {
  parcelId?: string;
  question: string;
  topK?: number;
}

export interface ConsultByTelegramRequestDto {
  telegramChatId: string;
  question: string;
  topK?: number;
}

export interface EmergencyBriefRequestDto {
  parcelId?: string;
  ruleCode: string;
  metrics?: Record<string, unknown>;
  defaultAction?: string;
}

export interface EmergencyBriefResponseDto {
  parcelId: string;
  ruleCode: string;
  emergencyParagraph: string;
  referencedDocumentCode: string | null;
  modelUsed: string;
  llmTimeMs: number;
}

export interface AgronomistConsultationResponseDto {
  consultationId: string;
  parcelId: string;
  question: string;
  answer: string;
  answerMarkdown: string;
  retrievedChunks: RetrievedChunkReference[];
  assembledContext: AssembledAgronomicContext;
  metrics: {
    embeddingTimeMs: number;
    llmTimeMs: number;
    totalTimeMs: number;
    embeddingModel: string;
    llmModel: string;
  };
  createdAt: string;
}

export interface SeedKnowledgeResponseDto {
  totalDocumentsProcessed: number;
  embeddingDimensions: number;
  embeddingModel: string;
  elapsedTimeMs: number;
  documents: Array<{
    documentCode: string;
    title: string;
    category: string;
    phenologicalStage: string;
  }>;
}
