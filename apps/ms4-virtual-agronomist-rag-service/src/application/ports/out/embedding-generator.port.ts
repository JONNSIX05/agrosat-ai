import { EmbeddingVector384Vo } from '../../../domain/value-objects/embedding-vector-384.vo';

export const EMBEDDING_GENERATOR_PORT = Symbol('EMBEDDING_GENERATOR_PORT');

export interface EmbeddingGenerationResult {
  vector: EmbeddingVector384Vo;
  elapsedMs: number;
  modelName: string;
}

export interface EmbeddingGeneratorPort {
  embedQuery(queryText: string): Promise<EmbeddingGenerationResult>;
  embedPassage(passageText: string): Promise<EmbeddingGenerationResult>;
  getModelStatus(): { modelName: string; isLoaded: boolean; runtime: string };
}
