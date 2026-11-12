import { Injectable, Logger } from '@nestjs/common';
import { PostgresService } from '@agrosat/shared-kernel';
import {
  PG_NOTIFY_CHANNELS,
  TelemetryAnomalyEventPayload,
} from '@agrosat/service-contracts';
import { TelemetryAnomalyPublisherPort } from '../../application/ports/out/telemetry-anomaly-publisher.port';

@Injectable()
export class PgNotifyTelemetryAnomalyAdapter implements TelemetryAnomalyPublisherPort {
  private readonly logger = new Logger(PgNotifyTelemetryAnomalyAdapter.name);
  private readonly ms5BaseUrl = process.env.MS5_INTERNAL_URL ?? 'http://localhost:3005';

  constructor(private readonly pg: PostgresService) {}

  public async publishTelemetryAnomaly(event: TelemetryAnomalyEventPayload): Promise<void> {
    // 1. Emitir notificación en canal PostgreSQL LISTEN/NOTIFY
    try {
      await this.pg.pgNotify(PG_NOTIFY_CHANNELS.TELEMETRY_ANOMALY, event);
    } catch (err) {
      this.logger.error(
        `Error publicando PG NOTIFY en ${PG_NOTIFY_CHANNELS.TELEMETRY_ANOMALY}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    // 2. Fallback HTTP hacia MS5 Alert Notification Service
    try {
      await fetch(`${this.ms5BaseUrl}/internal/v1/alerts/evaluate-telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(4000),
      });
    } catch {
      this.logger.debug(
        'MS5 recibió o recibirá la anomalía telemétrica vía canal PostgreSQL NOTIFY.',
      );
    }
  }
}
