import { Injectable } from '@nestjs/common';
import { PostgresService } from '@agrosat/shared-kernel';
import {
  AssembledAgronomicContext,
  AgronomicConsultationAggregate,
  RetrievedChunkReference,
} from '../../domain/entities/agronomic-consultation.aggregate';
import { KnowledgeChunkEntity } from '../../domain/entities/knowledge-chunk.entity';
import { EmbeddingVector384Vo } from '../../domain/value-objects/embedding-vector-384.vo';
import { VectorStoreRepositoryPort } from '../../application/ports/out/vector-store-repository.port';

interface ChunkRow {
  id: string;
  document_code: string;
  title: string;
  category: string;
  phenological_stage: string;
  content: string;
  metadata: Record<string, unknown> | string;
  similarity_score?: string | number;
  created_at: Date | string;
}

interface ConsultationRow {
  id: string;
  parcel_id: string;
  farmer_question: string;
  assembled_context: AssembledAgronomicContext | string;
  retrieved_chunks: RetrievedChunkReference[] | string;
  deepseek_answer: string;
  model_used: string;
  embedding_time_ms: number;
  llm_time_ms: number;
  created_at: Date | string;
}

@Injectable()
export class PgvectorKnowledgeRepository implements VectorStoreRepositoryPort {
  constructor(private readonly pg: PostgresService) {}

  public async upsertKnowledgeChunk(chunk: KnowledgeChunkEntity): Promise<void> {
    if (!chunk.embedding) {
      throw new Error(`El fragmento ${chunk.documentCode} requiere un vector de 384 dimensiones.`);
    }

    await this.pg.query(
      `
      INSERT INTO ms4_rag.watermelon_knowledge_chunks (
        id,
        document_code,
        title,
        category,
        phenological_stage,
        content,
        embedding,
        metadata
      ) VALUES (
        $1::uuid,
        $2::varchar,
        $3::varchar,
        $4::varchar,
        $5::varchar,
        $6::text,
        $7::vector(384),
        $8::jsonb
      )
      ON CONFLICT (document_code) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        phenological_stage = EXCLUDED.phenological_stage,
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata;
      `,
      [
        chunk.id,
        chunk.documentCode,
        chunk.title,
        chunk.category,
        chunk.phenologicalStage,
        chunk.content,
        chunk.embedding.toPgVectorLiteral(),
        JSON.stringify(chunk.metadata ?? {}),
      ],
    );
  }

  public async countKnowledgeChunks(): Promise<number> {
    const res = await this.pg.query<{ total: string | number }>(
      `SELECT COUNT(*) AS total FROM ms4_rag.watermelon_knowledge_chunks;`,
    );
    return Number(res.rows[0]?.total ?? 0);
  }

  public async listKnowledgeChunksSummary(): Promise<
    Array<{
      documentCode: string;
      title: string;
      category: string;
      phenologicalStage: string;
      createdAt: string;
    }>
  > {
    const res = await this.pg.query<{
      document_code: string;
      title: string;
      category: string;
      phenological_stage: string;
      created_at: Date | string;
    }>(
      `
      SELECT document_code, title, category, phenological_stage, created_at
      FROM ms4_rag.watermelon_knowledge_chunks
      ORDER BY document_code ASC;
      `,
    );

    return res.rows.map((r) => ({
      documentCode: r.document_code,
      title: r.title,
      category: r.category,
      phenologicalStage: r.phenological_stage,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  public async searchSimilarChunks(params: {
    queryVector: EmbeddingVector384Vo;
    topK: number;
    phenologicalStage?: string;
  }): Promise<KnowledgeChunkEntity[]> {
    const vectorLiteral = params.queryVector.toPgVectorLiteral();

    const res = await this.pg.query<ChunkRow>(
      `
      SELECT
        id,
        document_code,
        title,
        category,
        phenological_stage,
        content,
        metadata,
        ROUND((1 - (embedding <=> $1::vector(384)))::numeric, 4) AS similarity_score,
        created_at
      FROM ms4_rag.watermelon_knowledge_chunks
      ORDER BY embedding <=> $1::vector(384) ASC
      LIMIT $2::int;
      `,
      [vectorLiteral, params.topK],
    );

    return res.rows.map((row) =>
      KnowledgeChunkEntity.create(
        {
          documentCode: row.document_code,
          title: row.title,
          category: row.category,
          phenologicalStage: row.phenological_stage,
          content: row.content,
          metadata:
            typeof row.metadata === 'string'
              ? (JSON.parse(row.metadata) as Record<string, unknown>)
              : (row.metadata ?? {}),
          similarityScore: Number(row.similarity_score ?? 0),
          createdAt: new Date(row.created_at),
        },
        row.id,
      ),
    );
  }

  public async saveConsultationLog(
    consultation: AgronomicConsultationAggregate,
  ): Promise<AgronomicConsultationAggregate> {
    await this.pg.query(
      `
      INSERT INTO ms4_rag.consultation_logs (
        id,
        parcel_id,
        farmer_question,
        assembled_context,
        retrieved_chunks,
        deepseek_answer,
        model_used,
        embedding_time_ms,
        llm_time_ms,
        created_at
      ) VALUES (
        $1::uuid,
        $2::uuid,
        $3::text,
        $4::jsonb,
        $5::jsonb,
        $6::text,
        $7::varchar,
        $8::int,
        $9::int,
        $10::timestamptz
      );
      `,
      [
        consultation.id,
        consultation.parcelId,
        consultation.farmerQuestion,
        JSON.stringify(consultation.assembledContext ?? {}),
        JSON.stringify(consultation.retrievedChunks ?? []),
        consultation.deepseekAnswer,
        consultation.modelUsed,
        consultation.embeddingTimeMs,
        consultation.llmTimeMs,
        consultation.createdAt.toISOString(),
      ],
    );

    return consultation;
  }

  public async listConsultationHistory(
    parcelId: string,
    limit = 20,
  ): Promise<AgronomicConsultationAggregate[]> {
    const res = await this.pg.query<ConsultationRow>(
      `
      SELECT *
      FROM ms4_rag.consultation_logs
      WHERE parcel_id = $1::uuid
      ORDER BY created_at DESC
      LIMIT $2::int;
      `,
      [parcelId, limit],
    );

    return res.rows.map((row) =>
      AgronomicConsultationAggregate.create(
        {
          parcelId: row.parcel_id,
          farmerQuestion: row.farmer_question,
          assembledContext:
            typeof row.assembled_context === 'string'
              ? (JSON.parse(row.assembled_context) as AssembledAgronomicContext)
              : row.assembled_context,
          retrievedChunks:
            typeof row.retrieved_chunks === 'string'
              ? (JSON.parse(row.retrieved_chunks) as RetrievedChunkReference[])
              : row.retrieved_chunks,
          deepseekAnswer: row.deepseek_answer,
          modelUsed: row.model_used,
          embeddingTimeMs: Number(row.embedding_time_ms),
          llmTimeMs: Number(row.llm_time_ms),
          createdAt: new Date(row.created_at),
        },
        row.id,
      ),
    );
  }
}
