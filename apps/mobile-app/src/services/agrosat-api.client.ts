import { AGROSAT_ENV } from '../config/env';

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface SubcellFeature {
  type: 'Feature';
  id: string;
  geometry: GeoJsonPolygon;
  properties: {
    subcellId: string;
    row: number;
    col: number;
    centroid: { lon: number; lat: number };
    ndvi: number;
    evi: number;
    bandB02Blue: number;
    bandB04Red: number;
    bandB08Nir: number;
    vigorLevel: string;
    isStressedCell: boolean;
    fillColorHex: string;
  };
}

export interface ParcelDto {
  parcelId: string;
  farmerId: string;
  parcelName: string;
  watermelonVariety: string;
  plantingDate: string;
  areaHectares: number;
  perimeterMeters: number;
  centroid: { lon: number; lat: number };
  boundaryGeoJson: GeoJsonPolygon;
  soilSuitability?: {
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

export class AgroSatApiClient {
  private readonly baseUrl = AGROSAT_ENV.API_GATEWAY_URL;

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errBody}`);
    }
    return (await response.json()) as T;
  }

  public async listParcels(): Promise<ParcelDto[]> {
    const data = await this.request<ParcelDto[] | { parcels: ParcelDto[] }>('/api/v1/zoning/parcels');
    return Array.isArray(data) ? data : (data.parcels ?? []);
  }

  public createParcel(payload: {
    farmerId: string;
    parcelName: string;
    watermelonVariety: string;
    boundaryGeoJson: GeoJsonPolygon;
  }): Promise<ParcelDto> {
    return this.request<ParcelDto>('/api/v1/zoning/parcels', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getLatestSatelliteGrid(parcelId: string): Promise<{
    scene: {
      sceneId: string;
      sceneCode: string;
      daysAfterPlanting: number;
      phenologicalStage: string;
      meanNdvi: number;
      minNdvi: number;
      maxNdvi: number;
      meanEvi: number;
      stressedCellsPct?: number;
      hasStressPatch: boolean;
    };
    gridGeoJson: { type: 'FeatureCollection'; features: SubcellFeature[] };
  }> {
    const raw = await this.request<{
      scene: any;
      featureCollection?: { type: 'FeatureCollection'; features: SubcellFeature[] };
      gridGeoJson?: { type: 'FeatureCollection'; features: SubcellFeature[] };
    }>(`/api/v1/satellite/parcels/${parcelId}/latest-grid`);
    return {
      scene: raw.scene,
      gridGeoJson: raw.featureCollection ?? raw.gridGeoJson ?? { type: 'FeatureCollection', features: [] },
    };
  }

  public async getSceneGridById(sceneId: string): Promise<{
    scene: {
      sceneId: string;
      sceneCode: string;
      daysAfterPlanting: number;
      phenologicalStage: string;
      meanNdvi: number;
      minNdvi: number;
      maxNdvi: number;
      meanEvi: number;
      stressedCellsPct?: number;
      hasStressPatch: boolean;
    };
    gridGeoJson: { type: 'FeatureCollection'; features: SubcellFeature[] };
  }> {
    const raw = await this.request<{
      scene: any;
      featureCollection?: { type: 'FeatureCollection'; features: SubcellFeature[] };
      gridGeoJson?: { type: 'FeatureCollection'; features: SubcellFeature[] };
    }>(`/api/v1/satellite/scenes/${sceneId}/grid`);
    return {
      scene: raw.scene,
      gridGeoJson: raw.featureCollection ?? raw.gridGeoJson ?? { type: 'FeatureCollection', features: [] },
    };
  }

  public getSatelliteTimeSeries(parcelId: string): Promise<{
    parcelId: string;
    totalPasses: number;
    latestMeanNdvi: number;
    ndviDeltaFromPrevious: number;
    series: Array<{
      sceneId: string;
      sceneCode: string;
      daysAfterPlanting: number;
      phenologicalStage: string;
      meanNdvi: number;
      minNdvi: number;
      maxNdvi: number;
      meanEvi: number;
    }>;
  }> {
    return this.request(`/api/v1/satellite/parcels/${parcelId}/timeseries`);
  }

  public getTelemetryHistory(parcelId: string, limit = 24): Promise<{
    summary: {
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
        frostEventsCount: number;
        heatShockEventsCount: number;
      };
    };
    readings: Array<{
      readingId: string;
      recordedAt: string;
      ambientTempC: number;
      soilMoisture20cmPct: number;
      soilMoisture40cmPct: number;
      vpdKpa: number;
    }>;
  }> {
    return this.request(`/api/v1/telemetry/parcels/${parcelId}/history?limit=${limit}`);
  }

  public async listParcelAlerts(parcelId: string): Promise<
    Array<{
      alertId: string;
      ruleCode: string;
      severity: string;
      title: string;
      recommendedAction: string;
      n8nWebhookStatus: string;
      triggeredAt: string;
    }>
  > {
    const raw = await this.request<any>(`/api/v1/alerts/parcels/${parcelId}?limit=15`);
    return Array.isArray(raw) ? raw : (raw.alerts ?? []);
  }

  public linkTelegramSubscription(payload: {
    farmerId: string;
    fullName: string;
    telegramChatId: string;
    parcelId: string;
    parcelAlias: string;
  }): Promise<unknown> {
    return this.request('/api/v1/alerts/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public askVirtualAgronomist(payload: {
    parcelId: string;
    question: string;
    topK?: number;
  }): Promise<{
    consultationId: string;
    answerMarkdown: string;
    retrievedChunks: Array<{
      documentCode: string;
      title: string;
      similarityScore: number;
    }>;
    metrics: {
      embeddingTimeMs: number;
      llmTimeMs: number;
      llmModel: string;
    };
  }> {
    return this.request('/api/v1/agronomist/consult', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public triggerChaosSimulation(payload: {
    parcelId: string;
    scenario: 'FROST' | 'HEAT_DROUGHT' | 'NDVI_PLAGUE_DROP';
  }): Promise<{
    scenario: string;
    description: string;
    triggeredAt: string;
  }> {
    return this.request('/api/v1/simulation/trigger-chaos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const agroSatApi = new AgroSatApiClient();
