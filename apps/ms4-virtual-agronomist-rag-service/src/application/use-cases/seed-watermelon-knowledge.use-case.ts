import * as fs from 'fs';
import * as path from 'path';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { KnowledgeChunkEntity } from '../../domain/entities/knowledge-chunk.entity';
import { KnowledgeCorpusEmptyException } from '../../domain/exceptions/rag-domain.exceptions';
import { EmbeddingVector384Vo } from '../../domain/value-objects/embedding-vector-384.vo';
import { SeedKnowledgeResponseDto } from '../dtos/agronomist-consultation.dto';
import {
  EMBEDDING_GENERATOR_PORT,
  EmbeddingGeneratorPort,
} from '../ports/out/embedding-generator.port';
import {
  VECTOR_STORE_REPOSITORY_PORT,
  VectorStoreRepositoryPort,
} from '../ports/out/vector-store-repository.port';

interface RawCorpusDocument {
  documentCode: string;
  title: string;
  category: string;
  phenologicalStage: string;
  content: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SeedWatermelonKnowledgeUseCase {
  private readonly logger = new Logger(SeedWatermelonKnowledgeUseCase.name);

  constructor(
    @Inject(EMBEDDING_GENERATOR_PORT)
    private readonly embeddingGenerator: EmbeddingGeneratorPort,
    @Inject(VECTOR_STORE_REPOSITORY_PORT)
    private readonly vectorStoreRepo: VectorStoreRepositoryPort,
  ) {}

  public async execute(options: { forceReindex?: boolean } = {}): Promise<SeedKnowledgeResponseDto> {
    const startMs = Date.now();
    const existingCount = await this.vectorStoreRepo.countKnowledgeChunks();

    const corpusDocs = this.loadCorpusJson();
    if (!corpusDocs.length) {
      throw new KnowledgeCorpusEmptyException(
        'No se encontraron documentos técnicos en watermelon-knowledge-corpus.json.',
      );
    }

    if (existingCount >= corpusDocs.length && !options.forceReindex) {
      const modelStatus = this.embeddingGenerator.getModelStatus();
      return {
        totalDocumentsProcessed: existingCount,
        embeddingDimensions: EmbeddingVector384Vo.DIMENSIONS,
        embeddingModel: modelStatus.modelName,
        elapsedTimeMs: Date.now() - startMs,
        documents: corpusDocs.map((doc) => ({
          documentCode: doc.documentCode,
          title: doc.title,
          category: doc.category,
          phenologicalStage: doc.phenologicalStage,
        })),
      };
    }

    let lastModelName = 'Xenova/multilingual-e5-small';
    for (const doc of corpusDocs) {
      const passagePayload = `${doc.title}. Categoría: ${doc.category}. Etapa: ${doc.phenologicalStage}. ${doc.content}`;
      const embResult = await this.embeddingGenerator.embedPassage(passagePayload);
      lastModelName = embResult.modelName;

      const chunkEntity = KnowledgeChunkEntity.create({
        documentCode: doc.documentCode,
        title: doc.title,
        category: doc.category,
        phenologicalStage: doc.phenologicalStage,
        content: doc.content,
        embedding: embResult.vector,
        metadata: doc.metadata ?? {},
      });

      await this.vectorStoreRepo.upsertKnowledgeChunk(chunkEntity);
      this.logger.log(
        `📚 Indexado en pgvector VECTOR(384): [${doc.documentCode}] ${doc.title} (${embResult.elapsedMs} ms)`,
      );
    }

    return {
      totalDocumentsProcessed: corpusDocs.length,
      embeddingDimensions: EmbeddingVector384Vo.DIMENSIONS,
      embeddingModel: lastModelName,
      elapsedTimeMs: Date.now() - startMs,
      documents: corpusDocs.map((doc) => ({
        documentCode: doc.documentCode,
        title: doc.title,
        category: doc.category,
        phenologicalStage: doc.phenologicalStage,
      })),
    };
  }

  private loadCorpusJson(): RawCorpusDocument[] {
    const candidatePaths = [
      path.resolve(
        process.cwd(),
        'tools/simulators/seed-watermelon-kb/watermelon-knowledge-corpus.json',
      ),
      path.resolve(
        __dirname,
        '../../../../../../tools/simulators/seed-watermelon-kb/watermelon-knowledge-corpus.json',
      ),
    ];

    for (const filePath of candidatePaths) {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw) as RawCorpusDocument[];
      }
    }

    throw new KnowledgeCorpusEmptyException(
      `No se localizó el archivo watermelon-knowledge-corpus.json en ${candidatePaths.join(' ni en ')}`,
    );
  }
}
