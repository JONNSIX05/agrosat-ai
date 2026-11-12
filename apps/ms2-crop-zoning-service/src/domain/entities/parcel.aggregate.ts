import { AggregateRoot } from '@agrosat/shared-kernel';
import { GeoPolygonVo } from '../value-objects/geo-polygon.vo';
import { SoilEvaluationReportEntity } from './soil-evaluation-report.entity';

export interface ParcelAggregateProps {
  farmerId: string;
  parcelName: string;
  watermelonVariety: string;
  plantingDate: string;
  boundaryPolygon: GeoPolygonVo;
  centroid: { lon: number; lat: number };
  areaHectares: number;
  perimeterMeters: number;
  latestEvaluation?: SoilEvaluationReportEntity;
  createdAt: Date;
}

export class ParcelAggregate extends AggregateRoot<ParcelAggregateProps> {
  private constructor(props: ParcelAggregateProps, id?: string) {
    super(props, id);
  }

  public static create(props: ParcelAggregateProps, id?: string): ParcelAggregate {
    return new ParcelAggregate(props, id);
  }

  public attachSoilEvaluation(report: SoilEvaluationReportEntity): void {
    this.props.latestEvaluation = report;
  }

  get farmerId(): string {
    return this.props.farmerId;
  }

  get parcelName(): string {
    return this.props.parcelName;
  }

  get watermelonVariety(): string {
    return this.props.watermelonVariety;
  }

  get plantingDate(): string {
    return this.props.plantingDate;
  }

  get boundaryPolygon(): GeoPolygonVo {
    return this.props.boundaryPolygon;
  }

  get centroid(): { lon: number; lat: number } {
    return this.props.centroid;
  }

  get areaHectares(): number {
    return this.props.areaHectares;
  }

  get perimeterMeters(): number {
    return this.props.perimeterMeters;
  }

  get latestEvaluation(): SoilEvaluationReportEntity | undefined {
    return this.props.latestEvaluation;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
