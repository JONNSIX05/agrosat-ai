import { ValueObject } from '@agrosat/shared-kernel';

interface EviIndexProps {
  value: number;
}

export class EviIndexVo extends ValueObject<EviIndexProps> {
  private constructor(props: EviIndexProps) {
    super(props);
  }

  /**
   * Calcula EVI (Enhanced Vegetation Index) usando la ecuación estándar de Sentinel-2:
   * EVI = 2.5 * (NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1)
   */
  public static fromBands(b02Blue: number, b04Red: number, b08Nir: number): EviIndexVo {
    const denominator = b08Nir + 6.0 * b04Red - 7.5 * b02Blue + 1.0;
    const rawEvi = denominator !== 0 ? 2.5 * ((b08Nir - b04Red) / denominator) : 0;
    const clamped = Math.max(-0.1, Math.min(0.85, Number(rawEvi.toFixed(4))));
    return new EviIndexVo({ value: clamped });
  }

  public static fromValue(value: number): EviIndexVo {
    const clamped = Math.max(-0.1, Math.min(0.85, Number(value.toFixed(4))));
    return new EviIndexVo({ value: clamped });
  }

  get value(): number {
    return this.props.value;
  }
}
