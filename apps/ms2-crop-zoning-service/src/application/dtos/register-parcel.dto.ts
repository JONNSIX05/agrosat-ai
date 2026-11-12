import { GeoJsonPolygon, LatLngLiteral } from '@agrosat/gis-contracts';

export interface SimulatedSoilOverridesDto {
  soilTexture?: 'FRANCO_ARENOSA' | 'FRANCA' | 'ARENOSA' | 'ARCILLOSA';
  phLevel?: number;
  drainageLevel?: 'OPTIMO_BUENO' | 'MODERADO' | 'DEFICIENTE';
  altitudeMsnm?: number;
  solarRadiationMjm2?: number;
  slopePct?: number;
}

export interface RegisterParcelRequestDto {
  farmerId?: string;
  parcelName: string;
  watermelonVariety?: string;
  plantingDate?: string;
  /**
   * Puede enviarse un objeto GeoJSON Polygon directamente...
   */
  boundaryGeoJson?: GeoJsonPolygon;
  /**
   * ...o un arreglo de vértices [{ latitude, longitude }] trazados en el mapa móvil/web.
   */
  vertices?: LatLngLiteral[];
  /**
   * Opcional para forzar condiciones de suelo específicas durante pruebas/demos.
   */
  simulatedSoilOverrides?: SimulatedSoilOverridesDto;
}

export interface ReEvaluateParcelRequestDto {
  parcelId: string;
  simulatedSoilOverrides?: SimulatedSoilOverridesDto;
}
