import { AgronomicConsultationAggregate } from '../../../domain/entities/agronomic-consultation.aggregate';
import { KnowledgeChunkEntity } from '../../../domain/entities/knowledge-chunk.entity';
import { EmbeddingVector384Vo } from '../../../domain/value-objects/embedding-vector-384.vo';

export const VECTOR_STORE_REPOSITORY_PORT = Symbol('VECTOR_STORE_REPOSITORY_PORT');

export interface VectorStoreRepositoryPort {
  upsertKnowledgeChunk(chunk: KnowledgeChunkEntity): Promise<void>;
  countKnowledgeChunks(): Promise<number>;
  listKnowledgeChunksSummary(): Promise<
    Array<{
      documentCode: string;
      title: string;
      category: string;
      phenologicalStage: string;
      createdAt: string;
    }>
  >;
  searchSimilarChunks(params: {
    queryVector: EmbeddingVector384Vo;
    topK: number;
    phenologicalStage?: string;
  }): Promise<KnowledgeChunkEntity[]>;
  saveConsultationLog(
    consultation: AgronomicConsultationAggregate,
  ): Promise<AgronomicConsultationAggregate>;
  listConsultationHistory(
    parcelId: string,
    limit?: number,
  ): Promise<AgronomicConsultationAggregate[]>;
}
