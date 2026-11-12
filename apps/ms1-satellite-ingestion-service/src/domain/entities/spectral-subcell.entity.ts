import { Entity } from '@agrosat/shared-kernel';
import { GeoJsonPolygon } from '@agrosat/gis-contracts';
import { SpectralBandsVo } from '../value-objects/spectral-bands.vo';

export interface SpectralSubcellProps {
  parcelId: string;
  cellRow: number;
  cellCol: number;
  cellGeoJson: GeoJsonPolygon;
  centroid: { lon: number; lat: number };
  spectralBands: SpectralBandsVo;
}

export class SpectralSubcellEntity extends Entity<SpectralSubcellProps> {
  private constructor(props: SpectralSubcellProps, id?: string) {
    super(props, id);
  }

  public static create(props: SpectralSubcellProps, id?: string): SpectralSubcellEntity {
    return new SpectralSubcellEntity(props, id);
  }

  get parcelId(): string {
    return this.props.parcelId;
  }

  get cellRow(): number {
    return this.props.cellRow;
  }

  get cellCol(): number {
    return this.props.cellCol;
  }

  get cellGeoJson(): GeoJsonPolygon {
    return this.props.cellGeoJson;
  }

  get centroid(): { lon: number; lat: number } {
    return this.props.centroid;
  }

  get spectralBands(): SpectralBandsVo {
    return this.props.spectralBands;
  }

  get ndvi(): number {
    return this.props.spectralBands.ndvi.value;
  }

  get evi(): number {
    return this.props.spectralBands.evi.value;
  }

  get vigorLevel(): string {
    return this.props.spectralBands.ndvi.vigorLevel;
  }

  get isStressedCell(): boolean {
    return this.props.spectralBands.ndvi.isStressedCell;
  }
}
