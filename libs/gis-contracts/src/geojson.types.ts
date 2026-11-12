/**
 * Coordenada estándar WGS84 (SRID 4326) en formato GeoJSON: [longitude, latitude]
 */
export type GeoJsonPosition = [number, number];

export interface LatLngLiteral {
  latitude: number;
  longitude: number;
}

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: GeoJsonPosition;
}

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: GeoJsonPosition[][];
}

export interface GeoJsonFeature<
  TGeometry = GeoJsonPolygon | GeoJsonPoint,
  TProperties = Record<string, unknown>,
> {
  type: 'Feature';
  id?: string;
  geometry: TGeometry;
  properties: TProperties;
}

export interface GeoJsonFeatureCollection<
  TGeometry = GeoJsonPolygon | GeoJsonPoint,
  TProperties = Record<string, unknown>,
> {
  type: 'FeatureCollection';
  features: Array<GeoJsonFeature<TGeometry, TProperties>>;
}

export interface BoundingBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}
