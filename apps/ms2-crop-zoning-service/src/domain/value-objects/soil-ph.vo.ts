import { DomainException, ValueObject } from '@agrosat/shared-kernel';

interface SoilPhProps {
  value: number;
}

export class SoilPhVo extends ValueObject<SoilPhProps> {
  private constructor(props: SoilPhProps) {
    super(props);
  }

  public static create(value: number): SoilPhVo {
    if (!Number.isFinite(value) || value < 3.5 || value > 9.5) {
      throw new DomainException(
        'INVALID_SOIL_PH',
        `El pH del suelo (${value}) debe estar en el rango físico [3.5, 9.5].`,
      );
    }
    return new SoilPhVo({ value: Number(value.toFixed(2)) });
  }

  get value(): number {
    return this.props.value;
  }

  /**
   * Puntaje sobre 25 puntos máximos para cultivo de sandía (óptimo 6.0 - 6.8).
   */
  public computeScoreOutOf25(): { score: number; limitingReason?: string; recommendation?: string } {
    const ph = this.props.value;
    if (ph >= 6.0 && ph <= 6.8) {
      return { score: 25 };
    }
    if (ph >= 5.6 && ph < 6.0) {
      return {
        score: 21,
        recommendation:
          'pH ligeramente ácido (5.6 - 5.9): excelente tolerancia en sandía, vigilar disponibilidad de Calcio y Magnesio.',
      };
    }
    if (ph > 6.8 && ph <= 7.3) {
      return {
        score: 19,
        recommendation:
          'pH neutro-ligeramente alcalino (6.9 - 7.3): acidificar solución nutritiva a pH 6.0 en fertirriego para optimizar Hierro y Boro.',
      };
    }
    if (ph < 5.6) {
      return {
        score: 9,
        limitingReason: `Acidez edáfica elevada (pH ${ph} < 5.6) que favorece Fusarium oxysporum y deficiencia de Calcio`,
        recommendation:
          'Aplicar encalado con cal dolomítica (1.5 - 2.5 ton/ha) 30 días antes del trasplante para elevar pH y aportar Ca/Mg.',
      };
    }
    return {
      score: 10,
      limitingReason: `Alcalinidad elevada (pH ${ph} > 7.3) con bloqueo potencial de micronutrientes (Fe, Zn, B)`,
      recommendation:
        'Usar ácido fosfórico/nítrico en el cabezal de riego y aplicar microelementos quelatados (EDDHA/EDTA).',
    };
  }
}
