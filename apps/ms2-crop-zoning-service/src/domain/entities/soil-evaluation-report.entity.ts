import { Entity } from '@agrosat/shared-kernel';
import { AltitudeAndSlopeVo } from '../value-objects/altitude-and-slope.vo';
import { DrainageCapacityVo } from '../value-objects/drainage-capacity.vo';
import { SoilPhVo } from '../value-objects/soil-ph.vo';
import { SoilTextureTypeVo } from '../value-objects/soil-texture-type.vo';
import { SolarRadiationLevelVo } from '../value-objects/solar-radiation-level.vo';
import { WatermelonViabilityScoreVo } from '../value-objects/watermelon-viability-score.vo';

export interface SoilEvaluationReportProps {
  parcelId: string;
  soilTexture: SoilTextureTypeVo;
  soilPh: SoilPhVo;
  drainage: DrainageCapacityVo;
  solarRadiation: SolarRadiationLevelVo;
  topography: AltitudeAndSlopeVo;
  viabilityScore: WatermelonViabilityScoreVo;
  evaluatedAt: Date;
}

export class SoilEvaluationReportEntity extends Entity<SoilEvaluationReportProps> {
  private constructor(props: SoilEvaluationReportProps, id?: string) {
    super(props, id);
  }

  public static create(props: SoilEvaluationReportProps, id?: string): SoilEvaluationReportEntity {
    return new SoilEvaluationReportEntity(props, id);
  }

  get parcelId(): string {
    return this.props.parcelId;
  }

  get soilTexture(): SoilTextureTypeVo {
    return this.props.soilTexture;
  }

  get soilPh(): SoilPhVo {
    return this.props.soilPh;
  }

  get drainage(): DrainageCapacityVo {
    return this.props.drainage;
  }

  get solarRadiation(): SolarRadiationLevelVo {
    return this.props.solarRadiation;
  }

  get topography(): AltitudeAndSlopeVo {
    return this.props.topography;
  }

  get viabilityScore(): WatermelonViabilityScoreVo {
    return this.props.viabilityScore;
  }

  get evaluatedAt(): Date {
    return this.props.evaluatedAt;
  }
}
