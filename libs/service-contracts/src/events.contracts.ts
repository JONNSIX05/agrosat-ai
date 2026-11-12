export const PG_NOTIFY_CHANNELS = {
  TELEMETRY_ANOMALY: 'telemetry_anomaly_channel',
  SPECTRAL_ANOMALY: 'spectral_anomaly_channel',
} as const;

export type WatermelonPhenologicalStageCode =
  | 'PRE_PLANTING'
  | 'EMERGENCE'
  | 'VINE_GROWTH'
  | 'FLOWERING'
  | 'MATURATION';

export interface TelemetryAnomalyEventPayload {
  parcelId: string;
  readingId: string;
  recordedAt: string;
  ambientTempC: number;
  relativeHumidityPct: number;
  soilMoisture20cmPct: number;
  soilMoisture40cmPct: number;
  solarRadiationWm2: number;
  vpdKpa: number;
}

export interface SpectralAnomalyEventPayload {
  parcelId: string;
  sceneId: string;
  capturedAt: string;
  daysAfterPlanting: number;
  phenologicalStage: WatermelonPhenologicalStageCode;
  previousMeanNdvi: number;
  currentMeanNdvi: number;
  minNdvi: number;
  ndviDrop: number;
  stressedCellsPct: number;
  stressPatchCenter?: {
    lon: number;
    lat: number;
    radiusMeters: number;
    anomalyCause: string;
  };
}
