import { AggregateRoot } from '@agrosat/shared-kernel';
import { WatermelonPhenologicalStageCode } from '@agrosat/service-contracts';
import { StressPatchAnomalyProps } from '../value-objects/stress-patch-anomaly.vo';
import { SpectralSubcellEntity } from './spectral-subcell.entity';

export interface SentinelSceneAggregateProps {
  parcelId: string;
  sceneCode: string;
  capturedAt: Date;
  daysAfterPlanting: number;
  phenologicalStage: WatermelonPhenologicalStageCode;
  cloudCoverPct: number;
  meanNdvi: number;
  minNdvi: number;
  maxNdvi: number;
  stddevNdvi: number;
  meanEvi: number;
  stressedCellsPct: number;
  hasStressPatch: boolean;
  stressPatchMetadata?: StressPatchAnomalyProps | null;
  subcells: SpectralSubcellEntity[];
}

export class SentinelSceneAggregate extends AggregateRoot<SentinelSceneAggregateProps> {
  private constructor(props: SentinelSceneAggregateProps, id?: string) {
    super(props, id);
  }

  /**
   * Construye la escena satelital calculando automáticamente las estadísticas
   * espaciales agregadas (media, mínimo, máximo, desviación estándar y % de área estresada)
   * sobre todas las sub-celdas generadas en PostGIS.
   */
  public static createFromSubcells(params: {
    id?: string;
    parcelId: string;
    sceneCode?: string;
    capturedAt?: Date;
    daysAfterPlanting: number;
    phenologicalStage: WatermelonPhenologicalStageCode;
    cloudCoverPct?: number;
    hasStressPatch: boolean;
    stressPatchMetadata?: StressPatchAnomalyProps | null;
    subcells: SpectralSubcellEntity[];
  }): SentinelSceneAggregate {
    const cells = params.subcells;
    const count = Math.max(1, cells.length);

    let sumNdvi = 0;
    let sumEvi = 0;
    let minNdvi = Infinity;
    let maxNdvi = -Infinity;
    let stressedCount = 0;

    for (const c of cells) {
      sumNdvi += c.ndvi;
      sumEvi += c.evi;
      if (c.ndvi < minNdvi) minNdvi = c.ndvi;
      if (c.ndvi > maxNdvi) maxNdvi = c.ndvi;
      if (c.isStressedCell) stressedCount++;
    }

    const meanNdvi = Number((sumNdvi / count).toFixed(4));
    const meanEvi = Number((sumEvi / count).toFixed(4));

    let varianceSum = 0;
    for (const c of cells) {
      const diff = c.ndvi - meanNdvi;
      varianceSum += diff * diff;
    }
    const stddevNdvi = Number(Math.sqrt(varianceSum / count).toFixed(4));
    const stressedCellsPct = Number(((stressedCount / count) * 100).toFixed(2));

    const dateCode = (params.capturedAt ?? new Date()).toISOString().slice(0, 10).replace(/-/g, '');
    const sceneCode =
      params.sceneCode ?? `S2B_MSIL2A_${dateCode}_DAS${params.daysAfterPlanting}_SIM`;

    return new SentinelSceneAggregate(
      {
        parcelId: params.parcelId,
        sceneCode,
        capturedAt: params.capturedAt ?? new Date(),
        daysAfterPlanting: params.daysAfterPlanting,
        phenologicalStage: params.phenologicalStage,
        cloudCoverPct: params.cloudCoverPct ?? 0.0,
        meanNdvi,
        minNdvi: Number((Number.isFinite(minNdvi) ? minNdvi : meanNdvi).toFixed(4)),
        maxNdvi: Number((Number.isFinite(maxNdvi) ? maxNdvi : meanNdvi).toFixed(4)),
        stddevNdvi,
        meanEvi,
        stressedCellsPct,
        hasStressPatch: params.hasStressPatch || stressedCellsPct >= 12.0,
        stressPatchMetadata: params.stressPatchMetadata ?? null,
        subcells: cells,
      },
      params.id,
    );
  }

  public static createHydrated(
    props: SentinelSceneAggregateProps,
    id: string,
  ): SentinelSceneAggregate {
    return new SentinelSceneAggregate(props, id);
  }

  get parcelId(): string {
    return this.props.parcelId;
  }

  get sceneCode(): string {
    return this.props.sceneCode;
  }

  get capturedAt(): Date {
    return this.props.capturedAt;
  }

  get daysAfterPlanting(): number {
    return this.props.daysAfterPlanting;
  }

  get phenologicalStage(): WatermelonPhenologicalStageCode {
    return this.props.phenologicalStage;
  }

  get cloudCoverPct(): number {
    return this.props.cloudCoverPct;
  }

  get meanNdvi(): number {
    return this.props.meanNdvi;
  }

  get minNdvi(): number {
    return this.props.minNdvi;
  }

  get maxNdvi(): number {
    return this.props.maxNdvi;
  }

  get stddevNdvi(): number {
    return this.props.stddevNdvi;
  }

  get meanEvi(): number {
    return this.props.meanEvi;
  }

  get stressedCellsPct(): number {
    return this.props.stressedCellsPct;
  }

  get hasStressPatch(): boolean {
    return this.props.hasStressPatch;
  }

  get stressPatchMetadata(): StressPatchAnomalyProps | null | undefined {
    return this.props.stressPatchMetadata;
  }

  get subcells(): SpectralSubcellEntity[] {
    return this.props.subcells;
  }
}
