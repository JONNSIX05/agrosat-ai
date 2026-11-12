import { ValueObject } from '@agrosat/shared-kernel';
import { InvalidEmbeddingVectorException } from '../exceptions/rag-domain.exceptions';

export interface EmbeddingVector384Props {
  values: number[];
}

export class EmbeddingVector384Vo extends ValueObject<EmbeddingVector384Props> {
  public static readonly DIMENSIONS = 384;

  private constructor(props: EmbeddingVector384Props) {
    super(props);
  }

  public static create(rawValues: number[]): EmbeddingVector384Vo {
    if (!Array.isArray(rawValues) || rawValues.length !== EmbeddingVector384Vo.DIMENSIONS) {
      throw new InvalidEmbeddingVectorException(
        `El vector de embedding local (Xenova/multilingual-e5-small) debe tener exactamente ${EmbeddingVector384Vo.DIMENSIONS} dimensiones. Recibido: ${rawValues?.length ?? 0}.`,
        { receivedDimensions: rawValues?.length ?? 0 },
      );
    }

    let normSq = 0;
    const sanitized = new Array<number>(EmbeddingVector384Vo.DIMENSIONS);

    for (let i = 0; i < EmbeddingVector384Vo.DIMENSIONS; i++) {
      const val = Number(rawValues[i]);
      if (!Number.isFinite(val)) {
        throw new InvalidEmbeddingVectorException(
          `El vector de embedding contiene un valor no numérico en el índice ${i}.`,
        );
      }
      sanitized[i] = val;
      normSq += val * val;
    }

    const norm = Math.sqrt(normSq);
    if (norm < 1e-12) {
      throw new InvalidEmbeddingVectorException(
        'El vector de embedding de 384 dimensiones no puede tener magnitud cero.',
      );
    }

    const normalized = sanitized.map((v) => Number((v / norm).toFixed(6)));
    return new EmbeddingVector384Vo({ values: normalized });
  }

  public get values(): number[] {
    return this.props.values;
  }

  /**
   * Serializa el vector al formato literal requerido por pgvector: '[v1,v2,...,v384]'
   */
  public toPgVectorLiteral(): string {
    return `[${this.props.values.join(',')}]`;
  }
}
