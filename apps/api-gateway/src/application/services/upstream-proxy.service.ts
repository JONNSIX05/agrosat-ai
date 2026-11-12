import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

export type UpstreamServiceKey = 'ms1' | 'ms2' | 'ms3' | 'ms4' | 'ms5';

export interface ChaosSimulationRequest {
  parcelId?: string;
  scenario: 'FROST' | 'HEAT_DROUGHT' | 'NDVI_PLAGUE_DROP';
}

@Injectable()
export class UpstreamProxyService {
  private readonly logger = new Logger(UpstreamProxyService.name);

  private readonly upstreamBaseUrls: Record<UpstreamServiceKey, string> = {
    ms1: process.env.MS1_INTERNAL_URL || 'http://agrosat_ms1_satellite:3001',
    ms2: process.env.MS2_INTERNAL_URL || 'http://agrosat_ms2_zoning:3002',
    ms3: process.env.MS3_INTERNAL_URL || 'http://agrosat_ms3_telemetry:3003',
    ms4: process.env.MS4_INTERNAL_URL || 'http://agrosat_ms4_rag:3004',
    ms5: process.env.MS5_INTERNAL_URL || 'http://agrosat_ms5_alerts:3005',
  };

  public async forwardRequest(params: {
    target: UpstreamServiceKey;
    method: string;
    pathWithQuery: string;
    body?: unknown;
  }): Promise<{ status: number; data: unknown }> {
    const baseUrl = this.upstreamBaseUrls[params.target];
    const normalizedPath = params.pathWithQuery.startsWith('/')
      ? params.pathWithQuery
      : `/${params.pathWithQuery}`;
    const url = `${baseUrl}${normalizedPath}`;

    const method = params.method.toUpperCase();
    const hasBody =
      method !== 'GET' &&
      method !== 'HEAD' &&
      params.body !== undefined &&
      params.body !== null &&
      Object.keys(params.body as Record<string, unknown>).length > 0;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: hasBody ? JSON.stringify(params.body) : undefined,
        signal: AbortSignal.timeout(30000),
      });

      const rawText = await response.text();
      let parsed: unknown = rawText;
      try {
        parsed = rawText ? JSON.parse(rawText) : {};
      } catch {
        parsed = { raw: rawText };
      }

      return {
        status: response.status,
        data: parsed,
      };
    } catch (err) {
      this.logger.error(
        `Error en proxy hacia [${params.target}] ${method} ${url}: ${(err as Error).message}`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          errorCode: 'UPSTREAM_MICROSERVICE_UNAVAILABLE',
          targetService: params.target,
          targetUrl: url,
          message: `El microservicio ${params.target} no respondió a tiempo: ${(err as Error).message}`,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  public async getEcosystemHealth(): Promise<{
    gateway: string;
    status: string;
    timestamp: string;
    services: Record<string, unknown>;
  }> {
    const entries: Array<[UpstreamServiceKey, string]> = [
      ['ms1', 'ms1-satellite-ingestion-service'],
      ['ms2', 'ms2-crop-zoning-service'],
      ['ms3', 'ms3-agronomic-telemetry-service'],
      ['ms4', 'ms4-virtual-agronomist-rag-service'],
      ['ms5', 'ms5-alert-notification-service'],
    ];

    const checks = await Promise.all(
      entries.map(async ([key, label]) => {
        try {
          const res = await fetch(`${this.upstreamBaseUrls[key]}/health`, {
            signal: AbortSignal.timeout(4000),
          });
          const data = await res.json();
          return [key, { name: label, reachable: res.ok, details: data }];
        } catch (err) {
          return [
            key,
            {
              name: label,
              reachable: false,
              error: (err as Error).message,
            },
          ];
        }
      }),
    );

    const servicesMap = Object.fromEntries(checks);
    const allHealthy = checks.every(([, val]) => (val as { reachable: boolean }).reachable);

    return {
      gateway: 'agrosat-api-gateway',
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: servicesMap,
    };
  }

  public async triggerChaosScenario(params: {
    parcelId?: string;
    scenario: 'FROST' | 'HEAT_DROUGHT' | 'NDVI_PLAGUE_DROP';
  }): Promise<unknown> {
    const parcelId =
      params.parcelId || process.env.DEFAULT_PARCEL_ID || '00000000-0000-0000-0000-000000000001';
    const scenario = params.scenario || 'FROST';

    if (scenario === 'FROST') {
      const telemetryRes = await this.forwardRequest({
        target: 'ms3',
        method: 'POST',
        pathWithQuery: '/api/v1/telemetry/readings',
        body: {
          parcelId,
          sensorNodeCode: 'CHAOS-PANEL-FROST',
          ambientTempC: 1.9,
          relativeHumidityPct: 88.0,
          soilMoisture20cmPct: 30.5,
          soilMoisture40cmPct: 33.8,
          solarRadiationWm2: 12.0,
        },
      });

      await new Promise((r) => setTimeout(r, 600));
      const alertsRes = await this.forwardRequest({
        target: 'ms5',
        method: 'GET',
        pathWithQuery: `/api/v1/alerts/parcels/${parcelId}?limit=5`,
      });

      return {
        scenario: 'FROST',
        parcelId,
        description: 'Simulación de Helada Severa (1.9 °C < 4.0 °C) inyectada en MS3 -> pg_notify -> MS5',
        injectedReading: telemetryRes.data,
        latestAlerts: alertsRes.data,
        triggeredAt: new Date().toISOString(),
      };
    }

    if (scenario === 'HEAT_DROUGHT') {
      const telemetryRes = await this.forwardRequest({
        target: 'ms3',
        method: 'POST',
        pathWithQuery: '/api/v1/telemetry/readings',
        body: {
          parcelId,
          sensorNodeCode: 'CHAOS-PANEL-HEAT',
          ambientTempC: 41.2,
          relativeHumidityPct: 19.5,
          soilMoisture20cmPct: 17.8,
          soilMoisture40cmPct: 36.0,
          solarRadiationWm2: 965.0,
        },
      });

      await new Promise((r) => setTimeout(r, 600));
      const alertsRes = await this.forwardRequest({
        target: 'ms5',
        method: 'GET',
        pathWithQuery: `/api/v1/alerts/parcels/${parcelId}?limit=5`,
      });

      return {
        scenario: 'HEAT_DROUGHT',
        parcelId,
        description:
          'Simulación de Golpe de Calor (41.2 °C) y Sequía Radicular (17.8% a 20cm) inyectada en MS3 -> pg_notify -> MS5',
        injectedReading: telemetryRes.data,
        latestAlerts: alertsRes.data,
        triggeredAt: new Date().toISOString(),
      };
    }

    // NDVI_PLAGUE_DROP
    const satRes = await this.forwardRequest({
      target: 'ms1',
      method: 'POST',
      pathWithQuery: `/api/v1/satellite/parcels/${parcelId}/simulate-pass`,
      body: {
        daysAfterPlanting: 54,
        injectStressPatch: true,
        anomalyCause: 'FUSARIUM_OR_DRIP_TAPE_FAILURE',
        stressRadiusMeters: 48,
        ndviDropMagnitude: 0.39,
      },
    });

    await new Promise((r) => setTimeout(r, 600));
    const alertsRes = await this.forwardRequest({
      target: 'ms5',
      method: 'GET',
      pathWithQuery: `/api/v1/alerts/parcels/${parcelId}?limit=5`,
    });

    return {
      scenario: 'NDVI_PLAGUE_DROP',
      parcelId,
      description:
        'Simulación de Pasada Sentinel-2 con Mancha Crítica de Caída NDVI (-0.39 puntos) en MS1 -> pg_notify -> MS5',
      simulatedScene: satRes.data,
      latestAlerts: alertsRes.data,
      triggeredAt: new Date().toISOString(),
    };
  }
}
