import { ValueObject } from '@agrosat/shared-kernel';
import { InvalidSpectralBandException } from '../exceptions/satellite-domain.exceptions';

export type WatermelonVigorLevel =
  | 'CRITICAL_STRESS'
  | 'LOW_VIGOR'
  | 'MODERATE'
  | 'OPTIMAL_HIGH';

interface NdviIndexProps {
  value: number;
  vigorLevel: WatermelonVigorLevel;
  isStressedCell: boolean;
}

export class NdviIndexVo extends ValueObject<NdviIndexProps> {
  private constructor(props: NdviIndexProps) {
    super(props);
  }

  /**
   * Acota o valida el índice NDVI en el rango agronómico realista [-0.10, 0.85].
   */
  public static create(rawValue: number): NdviIndexVo {
    if (!Number.isFinite(rawValue)) {
      throw new InvalidSpectralBandException(`El valor de NDVI no es numérico: ${rawValue}`);
    }

    const clamped = Math.max(-0.1, Math.min(0.85, Number(rawValue.toFixed(4))));

    let vigorLevel: WatermelonVigorLevel;
    if (clamped < 0.25) {
      vigorLevel = 'CRITICAL_STRESS';
    } else if (clamped < 0.42) {
      vigorLevel = 'LOW_VIGOR';
    } else if (clamped < 0.62) {
      vigorLevel = 'MODERATE';
    } else {
      vigorLevel = 'OPTIMAL_HIGH';
    }

    return new NdviIndexVo({
      value: clamped,
      vigorLevel,
      isStressedCell: clamped < 0.35,
    });
  }

  get value(): number {
    return this.props.value;
  }

  get vigorLevel(): WatermelonVigorLevel {
    return this.props.vigorLevel;
  }

  get isStressedCell(): boolean {
    return this.props.isStressedCell;
  }
}
