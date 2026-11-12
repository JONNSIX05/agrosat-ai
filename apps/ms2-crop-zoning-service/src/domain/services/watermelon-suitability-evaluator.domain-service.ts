import { SoilEvaluationReportEntity } from '../entities/soil-evaluation-report.entity';
import { AltitudeAndSlopeVo } from '../value-objects/altitude-and-slope.vo';
import { DrainageCapacityVo } from '../value-objects/drainage-capacity.vo';
import { SoilPhVo } from '../value-objects/soil-ph.vo';
import { SoilTextureTypeVo } from '../value-objects/soil-texture-type.vo';
import { SolarRadiationLevelVo } from '../value-objects/solar-radiation-level.vo';
import { WatermelonViabilityScoreVo } from '../value-objects/watermelon-viability-score.vo';

export interface RawSimulatedEdaphicParams {
  soilTexture: string;
  phLevel: number;
  drainageLevel: string;
  altitudeMsnm: number;
  solarRadiationMjm2: number;
  slopePct: number;
}

export class WatermelonSuitabilityEvaluatorDomainService {
  /**
   * Evalúa las variables edafológicas y fisiográficas aplicando las reglas
   * agronómicas del cultivo de sandía (Citrullus lanatus).
   */
  public evaluateParcelForWatermelon(
    parcelId: string,
    raw: RawSimulatedEdaphicParams,
  ): SoilEvaluationReportEntity {
    const soilTexture = SoilTextureTypeVo.create(raw.soilTexture);
    const soilPh = SoilPhVo.create(raw.phLevel);
    const drainage = DrainageCapacityVo.create(raw.drainageLevel);
    const solarRadiation = SolarRadiationLevelVo.create(raw.solarRadiationMjm2);
    const topography = AltitudeAndSlopeVo.create(raw.altitudeMsnm, raw.slopePct);

    const textureEval = soilTexture.computeScoreOutOf25();
    const phEval = soilPh.computeScoreOutOf25();
    const drainageEval = drainage.computeScoreOutOf20();
    const radiationEval = solarRadiation.computeScoreOutOf15();
    const topographyEval = topography.computeScoreOutOf15();

    const limitingFactors: string[] = [];
    const recommendations: string[] = [];

    for (const item of [textureEval, phEval, drainageEval, radiationEval, topographyEval]) {
      if (item.limitingReason) {
        limitingFactors.push(item.limitingReason);
      }
      if (item.recommendation) {
        recommendations.push(item.recommendation);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Condiciones edafoclimáticas óptimas para siembra de sandía. Mantener acolchado plástico y programa preventivo de Calcio-Boro desde floración.',
      );
    }

    const viabilityScore = WatermelonViabilityScoreVo.create({
      breakdown: {
        textureScore: textureEval.score,
        phScore: phEval.score,
        drainageScore: drainageEval.score,
        radiationScore: radiationEval.score,
        topographyScore: topographyEval.score,
        recommendations,
      },
      limitingFactors,
    });

    return SoilEvaluationReportEntity.create({
      parcelId,
      soilTexture,
      soilPh,
      drainage,
      solarRadiation,
      topography,
      viabilityScore,
      evaluatedAt: new Date(),
    });
  }
}
