import { ValueObject } from '@agrosat/shared-kernel';
import { GisGeometryUtil } from '@agrosat/gis-contracts';

export interface StressPatchAnomalyProps {
  centerLon: number;
  centerLat: number;
  radiusMeters: number;
  ndviDropMagnitude: number;
  targetMinNdvi: number;
  anomalyCause: string;
}

export class StressPatchAnomalyVo extends ValueObject<StressPatchAnomalyProps> {
  private constructor(props: StressPatchAnomalyProps) {
    super(props);
  }

  public static create(params: {
    centerLon: number;
    centerLat: number;
    radiusMeters?: number;
    ndviDropMagnitude?: number;
    targetMinNdvi?: number;
    anomalyCause?: string;
  }): StressPatchAnomalyVo {
    return new StressPatchAnomalyVo({
      centerLon: Number(params.centerLon.toFixed(6)),
      centerLat: Number(params.centerLat.toFixed(6)),
      radiusMeters: Math.max(10, Math.min(250, params.radiusMeters ?? 42)),
      ndviDropMagnitude: Math.max(0.15, Math.min(0.65, params.ndviDropMagnitude ?? 0.36)),
      targetMinNdvi: Math.max(0.12, Math.min(0.35, params.targetMinNdvi ?? 0.26)),
      anomalyCause: params.anomalyCause ?? 'FUSARIUM_OR_DRIP_TAPE_FAILURE',
    });
  }

  /**
   * Calcula la atenuación gaussiana radial del NDVI en función de la distancia en metros
   * desde el centroide de la sub-celda al epicentro de la mancha de estrés/plaga.
   */
  public computeCellNdviDrop(cellLon: number, cellLat: number, healthyNdvi: number): number {
    const distanceMeters = GisGeometryUtil.haversineDistanceMeters(
      cellLon,
      cellLat,
      this.props.centerLon,
      this.props.centerLat,
    );

    if (distanceMeters > this.props.radiusMeters * 1.45) {
      return 0;
    }

    const sigma = this.props.radiusMeters * 0.55;
    const gaussianFactor = Math.exp(-(distanceMeters * distanceMeters) / (2 * sigma * sigma));
    const maxNeededDrop = Math.max(
      this.props.ndviDropMagnitude,
      healthyNdvi - this.props.targetMinNdvi,
    );

    return Number((maxNeededDrop * gaussianFactor).toFixed(4));
  }

  get centerLon(): number {
    return this.props.centerLon;
  }

  get centerLat(): number {
    return this.props.centerLat;
  }

  get radiusMeters(): number {
    return this.props.radiusMeters;
  }

  get ndviDropMagnitude(): number {
    return this.props.ndviDropMagnitude;
  }

  get targetMinNdvi(): number {
    return this.props.targetMinNdvi;
  }

  get anomalyCause(): string {
    return this.props.anomalyCause;
  }
}
