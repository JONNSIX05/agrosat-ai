import { ValueObject } from '@agrosat/shared-kernel';

export type SuitabilityCategoryCode =
  | 'ALTAMENTE_APTO'
  | 'MODERADAMENTE_APTO'
  | 'MARGINAL'
  | 'NO_APTO';

export interface TechnicalScoreBreakdown {
  textureScore: number;      // Max 25
  phScore: number;           // Max 25
  drainageScore: number;     // Max 20
  radiationScore: number;    // Max 15
  topographyScore: number;   // Max 15
  recommendations: string[];
}

interface WatermelonViabilityScoreProps {
  viabilityScorePct: number;
  suitabilityCategory: SuitabilityCategoryCode;
  breakdown: TechnicalScoreBreakdown;
  limitingFactors: string[];
}

export class WatermelonViabilityScoreVo extends ValueObject<WatermelonViabilityScoreProps> {
  private constructor(props: WatermelonViabilityScoreProps) {
    super(props);
  }

  public static create(params: {
    breakdown: TechnicalScoreBreakdown;
    limitingFactors: string[];
  }): WatermelonViabilityScoreVo {
    const rawTotal =
      params.breakdown.textureScore +
      params.breakdown.phScore +
      params.breakdown.drainageScore +
      params.breakdown.radiationScore +
      params.breakdown.topographyScore;

    const viabilityScorePct = Math.max(0, Math.min(100, Number(rawTotal.toFixed(2))));

    let suitabilityCategory: SuitabilityCategoryCode;
    if (viabilityScorePct >= 82) {
      suitabilityCategory = 'ALTAMENTE_APTO';
    } else if (viabilityScorePct >= 62) {
      suitabilityCategory = 'MODERADAMENTE_APTO';
    } else if (viabilityScorePct >= 42) {
      suitabilityCategory = 'MARGINAL';
    } else {
      suitabilityCategory = 'NO_APTO';
    }

    return new WatermelonViabilityScoreVo({
      viabilityScorePct,
      suitabilityCategory,
      breakdown: params.breakdown,
      limitingFactors: params.limitingFactors,
    });
  }

  get viabilityScorePct(): number {
    return this.props.viabilityScorePct;
  }

  get suitabilityCategory(): SuitabilityCategoryCode {
    return this.props.suitabilityCategory;
  }

  get breakdown(): TechnicalScoreBreakdown {
    return this.props.breakdown;
  }

  get limitingFactors(): string[] {
    return this.props.limitingFactors;
  }
}
