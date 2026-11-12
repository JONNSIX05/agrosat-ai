import { Entity } from '@agrosat/shared-kernel';
import { EmbeddingVector384Vo } from '../value-objects/embedding-vector-384.vo';

export interface KnowledgeChunkProps {
  documentCode: string;
  title: string;
  category: string;
  phenologicalStage: string;
  content: string;
  embedding?: EmbeddingVector384Vo;
  metadata: Record<string, unknown>;
  similarityScore?: number;
  createdAt: Date;
}

export class KnowledgeChunkEntity extends Entity<KnowledgeChunkProps> {
  private constructor(props: KnowledgeChunkProps, id?: string) {
    super(props, id);
  }

  public static create(
    params: {
      documentCode: string;
      title: string;
      category: string;
      phenologicalStage: string;
      content: string;
      embedding?: EmbeddingVector384Vo;
      metadata?: Record<string, unknown>;
      similarityScore?: number;
      createdAt?: Date;
    },
    id?: string,
  ): KnowledgeChunkEntity {
    return new KnowledgeChunkEntity(
      {
        documentCode: params.documentCode,
        title: params.title,
        category: params.category,
        phenologicalStage: params.phenologicalStage,
        content: params.content,
        embedding: params.embedding,
        metadata: params.metadata ?? {},
        similarityScore: params.similarityScore,
        createdAt: params.createdAt ?? new Date(),
      },
      id,
    );
  }

  public get documentCode(): string {
    return this.props.documentCode;
  }

  public get title(): string {
    return this.props.title;
  }

  public get category(): string {
    return this.props.category;
  }

  public get phenologicalStage(): string {
    return this.props.phenologicalStage;
  }

  public get content(): string {
    return this.props.content;
  }

  public get embedding(): EmbeddingVector384Vo | undefined {
    return this.props.embedding;
  }

  public get metadata(): Record<string, unknown> {
    return this.props.metadata;
  }

  public get similarityScore(): number | undefined {
    return this.props.similarityScore;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }
}
