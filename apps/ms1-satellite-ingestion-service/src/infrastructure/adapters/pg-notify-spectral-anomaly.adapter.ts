import { Injectable, Logger } from '@nestjs/common';
import { PostgresService } from '@agrosat/shared-kernel';
import {
  PG_NOTIFY_CHANNELS,
  SpectralAnomalyEventPayload,
} from '@agrosat/service-contracts';
import { SpectralAnomalyNotifierPort } from '../../application/ports/out/spectral-anomaly-notifier.port';

@Injectable()
export class PgNotifySpectralAnomalyAdapter implements SpectralAnomalyNotifierPort {
  private readonly logger = new Logger(PgNotifySpectralAnomalyAdapter.name);
  private readonly ms5BaseUrl = process.env.MS5_INTERNAL_URL ?? 'http://localhost:3005';

  constructor(private readonly pg: PostgresService) {}

  public async notifySpectralAnomaly(event: SpectralAnomalyEventPayload): Promise<void> {
    // 1. Publicar evento asíncrono en canal LISTEN/NOTIFY de PostgreSQL
    try {
      await this.pg.pgNotify(PG_NOTIFY_CHANNELS.SPECTRAL_ANOMALY, event);
    } catch (err) {
      this.logger.error(
        `Error emitiendo PG NOTIFY en ${PG_NOTIFY_CHANNELS.SPECTRAL_ANOMALY}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    // 2. Fallback HTTP directo hacia MS5 Alert Notification Service (si está activo)
    try {
      await fetch(`${this.ms5BaseUrl}/internal/v1/alerts/evaluate-ndvi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(4000),
      });
    } catch {
      this.logger.debug(
        'MS5 aún no disponible por HTTP directo; evento entregado vía PostgreSQL NOTIFY.',
      );
    }
  }
}
