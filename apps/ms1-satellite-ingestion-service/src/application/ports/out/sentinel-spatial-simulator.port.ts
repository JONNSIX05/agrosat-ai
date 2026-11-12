import { GeoJsonPolygon } from '@agrosat/gis-contracts';
import { SentinelSceneAggregate } from '../../../domain/entities/sentinel-scene.aggregate';
import { StressPatchAnomalyVo } from '../../../domain/value-objects/stress-patch-anomaly.vo';
import { WatermelonPhenologyVo } from '../../../domain/value-objects/watermelon-phenology.vo';

export const SENTINEL_SPATIAL_SIMULATOR_PORT = Symbol('SENTINEL_SPATIAL_SIMULATOR_PORT');

export interface SimulateSceneSpatialParams {
  parcelId: string;
  parcelPolygonGeoJson: GeoJsonPolygon;
  phenology: WatermelonPhenologyVo;
  stressPatch?: StressPatchAnomalyVo | null;
  simulationSeed?: number;
}

export interface SentinelSpatialSimulatorPort {
  generateSimulatedScene(params: SimulateSceneSpatialParams): Promise<SentinelSceneAggregate>;
}
