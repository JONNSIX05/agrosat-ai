import { GeoJsonPolygon } from '@agrosat/gis-contracts';
import { WatermelonPhenologicalStageCode } from './events.contracts';

/**
 * Contratos HTTP internos consumidos entre MS1, MS2, MS3, MS4 y MS5
 */
export interface ParcelSuitabilityContextDto {
  parcelId: string;
  farmerId: string;
  parcelName: string;
  watermelonVariety: string;
  plantingDate: string;
  areaHectares: number;
  centroid: { lon: number; lat: number };
  boundaryGeoJson: GeoJsonPolygon;
  soilEvaluation: {
    soilTexture: string;
    phLevel: number;
    drainageLevel: string;
    altitudeMsnm: number;
    solarRadiationMjm2: number;
    slopePct: number;
    viabilityScorePct: number;
    suitabilityCategory: string;
    limitingFactors: string[];
  };
}

export interface LatestSatelliteSceneContextDto {
  sceneId: string;
  parcelId: string;
  capturedAt: string;
  daysAfterPlanting: number;
  phenologicalStage: WatermelonPhenologicalStageCode;
  meanNdvi: number;
  minNdvi: number;
  maxNdvi: number;
  meanEvi: number;
  ndviDelta: number;
  stressedCellsPct: number;
  hasStressPatch: boolean;
  stressPatchMetadata?: {
    centerLon: number;
    centerLat: number;
    radiusMeters: number;
    ndviDropMagnitude: number;
    anomalyCause: string;
  };
}

export interface TelemetrySummaryContextDto {
  parcelId: string;
  current: {
    recordedAt: string;
    ambientTempC: number;
    relativeHumidityPct: number;
    soilMoisture20cmPct: number;
    soilMoisture40cmPct: number;
    solarRadiationWm2: number;
    vpdKpa: number;
  };
  stats24h: {
    tempAvg: number;
    tempMin: number;
    tempMax: number;
    moisture20cmAvg: number;
    moisture40cmAvg: number;
    radiationAvg: number;
    frostEventsCount: number;
    heatShockEventsCount: number;
  };
  stats7d: {
    tempAvg: number;
    tempMin: number;
    tempMax: number;
    moisture20cmAvg: number;
    moisture40cmAvg: number;
    vpdAvg: number;
  };
}
