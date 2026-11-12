import { GeoJsonPolygon } from '@agrosat/gis-contracts';

export const PARCEL_GEOMETRY_PROVIDER_PORT = Symbol('PARCEL_GEOMETRY_PROVIDER_PORT');

export interface ParcelGeometryMetadata {
  parcelId: string;
  parcelName: string;
  plantingDate: string;
  areaHectares: number;
  centroid: { lon: number; lat: number };
  boundaryGeoJson: GeoJsonPolygon;
}

export interface ParcelGeometryProviderPort {
  getParcelGeometry(parcelId: string): Promise<ParcelGeometryMetadata | null>;
}
