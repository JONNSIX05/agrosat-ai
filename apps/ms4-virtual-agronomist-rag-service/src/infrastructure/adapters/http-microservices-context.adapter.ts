import { Injectable, Logger } from '@nestjs/common';
import {
  LatestSatelliteSceneContextDto,
  ParcelSuitabilityContextDto,
  TelemetrySummaryContextDto,
} from '@agrosat/service-contracts';
import { PostgresService } from '@agrosat/shared-kernel';
import { AssembledAgronomicContext } from '../../domain/entities/agronomic-consultation.aggregate';
import { MicroservicesContextPort } from '../../application/ports/out/microservices-context.port';

@Injectable()
export class HttpMicroservicesContextAdapter implements MicroservicesContextPort {
  private readonly logger = new Logger(HttpMicroservicesContextAdapter.name);

  private readonly ms1Url = process.env.MS1_INTERNAL_URL || 'http://agrosat_ms1_satellite:3001';
  private readonly ms2Url = process.env.MS2_INTERNAL_URL || 'http://agrosat_ms2_zoning:3002';
  private readonly ms3Url = process.env.MS3_INTERNAL_URL || 'http://agrosat_ms3_telemetry:3003';
  private readonly ms5Url = process.env.MS5_INTERNAL_URL || 'http://agrosat_ms5_alerts:3005';

  constructor(private readonly pg: PostgresService) {}

  public async assembleParcelContext(parcelId: string): Promise<AssembledAgronomicContext> {
    const [parcel, satellite, telemetry] = await Promise.all([
      this.fetchParcelContext(parcelId),
      this.fetchSatelliteContext(parcelId),
      this.fetchTelemetryContext(parcelId),
    ]);

    return {
      parcel,
      satellite,
      telemetry,
    };
  }

  public async resolveParcelIdByTelegramChatId(telegramChatId: string): Promise<string> {
    const defaultParcelId =
      process.env.DEFAULT_PARCEL_ID || '00000000-0000-0000-0000-000000000001';

    if (!telegramChatId) {
      return defaultParcelId;
    }

    try {
      const res = await fetch(
        `${this.ms5Url}/internal/v1/alerts/telegram/${encodeURIComponent(telegramChatId)}/parcel`,
        { signal: AbortSignal.timeout(3000) },
      );
      if (res.ok) {
        const data = (await res.json()) as { parcelId?: string };
        if (data?.parcelId) {
          return data.parcelId;
        }
      }
    } catch {
      // Fallback directo a PostgreSQL si MS5 no responde a tiempo
    }

    try {
      const dbRes = await this.pg.query<{ parcel_id: string }>(
        `
        SELECT fps.parcel_id
        FROM ms5_alerts.farmers f
        INNER JOIN ms5_alerts.farmer_parcel_subscriptions fps ON fps.farmer_id = f.id
        WHERE f.telegram_chat_id = $1::varchar
        ORDER BY f.created_at DESC
        LIMIT 1;
        `,
        [telegramChatId],
      );
      if (dbRes.rows[0]?.parcel_id) {
        return dbRes.rows[0].parcel_id;
      }
    } catch (err) {
      this.logger.warn(`Error resolviendo parcela por telegramChatId: ${(err as Error).message}`);
    }

    return defaultParcelId;
  }

  private async fetchParcelContext(
    parcelId: string,
  ): Promise<ParcelSuitabilityContextDto | null> {
    try {
      const res = await fetch(
        `${this.ms2Url}/internal/v1/parcels/${encodeURIComponent(parcelId)}/context`,
        { signal: AbortSignal.timeout(3500) },
      );
      if (res.ok) {
        return (await res.json()) as ParcelSuitabilityContextDto;
      }
    } catch (err) {
      this.logger.warn(`Fallback SQL para contexto MS2 (${(err as Error).message})`);
    }
    return null;
  }

  private async fetchSatelliteContext(
    parcelId: string,
  ): Promise<LatestSatelliteSceneContextDto | null> {
    try {
      const res = await fetch(
        `${this.ms1Url}/internal/v1/satellite/${encodeURIComponent(parcelId)}/latest-summary`,
        { signal: AbortSignal.timeout(3500) },
      );
      if (res.ok) {
        return (await res.json()) as LatestSatelliteSceneContextDto;
      }
    } catch (err) {
      this.logger.warn(`Fallback para contexto MS1 (${(err as Error).message})`);
    }
    return null;
  }

  private async fetchTelemetryContext(
    parcelId: string,
  ): Promise<TelemetrySummaryContextDto | null> {
    try {
      const res = await fetch(
        `${this.ms3Url}/internal/v1/telemetry/${encodeURIComponent(parcelId)}/summary`,
        { signal: AbortSignal.timeout(3500) },
      );
      if (res.ok) {
        return (await res.json()) as TelemetrySummaryContextDto;
      }
    } catch (err) {
      this.logger.warn(`Fallback para contexto MS3 (${(err as Error).message})`);
    }
    return null;
  }
}
