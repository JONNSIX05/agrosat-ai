import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import {
  EmbeddingGenerationResult,
  EmbeddingGeneratorPort,
} from '../../application/ports/out/embedding-generator.port';
import { EmbeddingVector384Vo } from '../../domain/value-objects/embedding-vector-384.vo';

type FeatureExtractionPipeline = (
  text: string,
  options?: { pooling?: 'mean' | 'cls'; normalize?: boolean },
) => Promise<{ data: Float32Array | number[] }>;

@Injectable()
export class LocalTransformersEmbeddingAdapter implements EmbeddingGeneratorPort {
  private readonly logger = new Logger(LocalTransformersEmbeddingAdapter.name);
  private readonly modelName =
    process.env.LOCAL_EMBEDDING_MODEL || 'Xenova/multilingual-e5-small';
  private readonly cacheDir = process.env.TRANSFORMERS_CACHE || '/app/.cache/huggingface';

  private extractorPromise: Promise<FeatureExtractionPipeline | null> | null = null;
  private isOnnxReady = false;

  public async embedQuery(queryText: string): Promise<EmbeddingGenerationResult> {
    const formatted = `query: ${(queryText || '').trim()}`;
    return this.computeEmbedding(formatted);
  }

  public async embedPassage(passageText: string): Promise<EmbeddingGenerationResult> {
    const formatted = `passage: ${(passageText || '').trim()}`;
    return this.computeEmbedding(formatted);
  }

  public getModelStatus(): { modelName: string; isLoaded: boolean; runtime: string } {
    return {
      modelName: this.modelName,
      isLoaded: this.isOnnxReady,
      runtime: this.isOnnxReady ? 'onnxruntime-node (CPU 384d)' : 'initializing/fallback-384d',
    };
  }

  private async computeEmbedding(formattedInput: string): Promise<EmbeddingGenerationResult> {
    const startMs = Date.now();
    const extractor = await this.getOrInitExtractor();

    if (extractor) {
      try {
        const tensor = await extractor(formattedInput, {
          pooling: 'mean',
          normalize: true,
        });
        const rawArray = Array.from(tensor.data).slice(0, EmbeddingVector384Vo.DIMENSIONS);
        const vector = EmbeddingVector384Vo.create(rawArray);
        return {
          vector,
          elapsedMs: Date.now() - startMs,
          modelName: `${this.modelName} (ONNX-CPU)`,
        };
      } catch (err) {
        this.logger.warn(
          `Error en ejecución ONNX (${(err as Error).message}). Usando proyección determinista 384d.`,
        );
      }
    }

    const fallbackVector = this.computeDeterministicSemanticVector384(formattedInput);
    return {
      vector: fallbackVector,
      elapsedMs: Date.now() - startMs,
      modelName: `${this.modelName} (deterministic-384d)`,
    };
  }

  private async getOrInitExtractor(): Promise<FeatureExtractionPipeline | null> {
    if (!this.extractorPromise) {
      this.extractorPromise = this.loadTransformersPipeline();
    }
    return this.extractorPromise;
  }

  private async loadTransformersPipeline(): Promise<FeatureExtractionPipeline | null> {
    try {
      this.logger.log(
        `⚡ Inicializando modelo ONNX local ${this.modelName} en caché ${this.cacheDir}...`,
      );
      // Evita que TypeScript (module: commonjs) transforme import() en require() para paquetes ESM
      const dynamicImport = new Function('specifier', 'return import(specifier)') as (
        specifier: string,
      ) => Promise<{
        pipeline: (
          task: string,
          model: string,
          options?: Record<string, unknown>,
        ) => Promise<FeatureExtractionPipeline>;
        env: { cacheDir?: string; allowLocalModels?: boolean };
      }>;

      const { pipeline, env } = await dynamicImport('@huggingface/transformers');
      env.cacheDir = this.cacheDir;
      env.allowLocalModels = true;

      const extractor = await pipeline('feature-extraction', this.modelName, {
        quantized: true,
      });

      this.isOnnxReady = true;
      this.logger.log(
        `✅ Modelo ONNX ${this.modelName} (VECTOR 384) cargado exitosamente en memoria CPU.`,
      );
      return extractor;
    } catch (err) {
      this.logger.warn(
        `⚠️ No se pudo cargar el pipeline ONNX de @huggingface/transformers (${(err as Error).message}). Se utilizará vectorizador léxico-semántico de 384 dimensiones.`,
      );
      this.isOnnxReady = false;
      return null;
    }
  }

  private computeDeterministicSemanticVector384(text: string): EmbeddingVector384Vo {
    const dims = EmbeddingVector384Vo.DIMENSIONS;
    const accum = new Float64Array(dims);
    const normalizedText = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ');

    const tokens = normalizedText.split(/\s+/).filter((t) => t.length >= 2);
    for (const token of tokens) {
      const digest = createHash('sha256').update(token).digest();
      for (let i = 0; i < 12; i++) {
        const idx = ((digest[i * 2] << 8) | digest[i * 2 + 1]) % dims;
        const sign = (digest[i] & 1) === 0 ? 1.0 : -1.0;
        accum[idx] += sign * 1.5;
      }
    }

    if (tokens.length === 0) {
      accum[0] = 1.0;
    }

    return EmbeddingVector384Vo.create(Array.from(accum));
  }
}
