import { DomainException } from '@agrosat/shared-kernel';

export class InvalidEmbeddingVectorException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super('INVALID_EMBEDDING_VECTOR_384', message, details);
  }
}

export class InvalidAgronomicQuestionException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super('INVALID_AGRONOMIC_QUESTION', message, details);
  }
}

export class KnowledgeCorpusEmptyException extends DomainException {
  constructor(message: string) {
    super('KNOWLEDGE_CORPUS_EMPTY', message);
  }
}
