export interface IngestTelemetryReadingRequestDto {
  parcelId?: string;
  sensorNodeCode?: string;
  recordedAt?: string;
  ambientTempC: number;
  relativeHumidityPct: number;
  soilMoisture20cmPct: number;
  soilMoisture40cmPct?: number;
  solarRadiationWm2?: number;
}

export interface TelemetryReadingResponseDto {
  readingId: string;
  parcelId: string;
  sensorNodeCode: string;
  recordedAt: string;
  ambientTempC: number;
  relativeHumidityPct: number;
  soilMoisture20cmPct: number;
  soilMoisture40cmPct: number;
  solarRadiationWm2: number;
  vpdKpa: number;
  isAnomalyFlagged: boolean;
}
