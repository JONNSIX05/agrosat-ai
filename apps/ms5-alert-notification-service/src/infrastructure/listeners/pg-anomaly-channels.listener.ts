import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PostgresService } from '@agrosat/shared-kernel';
import {
  PG_NOTIFY_CHANNELS,
  SpectralAnomalyEventPayload,
  TelemetryAnomalyEventPayload,
} from '@agrosat/service-contracts';
import { PoolClient } from 'pg';
import { EvaluateSpectralAnomalyUseCase } from '../../application/use-cases/evaluate-spectral-anomaly.use-case';
import { EvaluateTelemetryAnomalyUseCase } from '../../application/use-cases/evaluate-telemetry-anomaly.use-case';

@Injectable()
export class PgAnomalyChannelsListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgAnomalyChannelsListener.name);
  private listenerClient: PoolClient | null = null;
  private readonly processedEventIds = new Set<string>();

  constructor(
    private readonly pg: PostgresService,
    private readonly evaluateTelemetryUseCase: EvaluateTelemetryAnomalyUseCase,
    private readonly evaluateSpectralUseCase: EvaluateSpectralAnomalyUseCase,
  ) {}

  public async onModuleInit(): Promise<void> {
    try {
      this.listenerClient = await this.pg.getClient();
      await this.listenerClient.query(`LISTEN ${PG_NOTIFY_CHANNELS.TELEMETRY_ANOMALY}`);
      await this.listenerClient.query(`LISTEN ${PG_NOTIFY_CHANNELS.SPECTRAL_ANOMALY}`);

      this.listenerClient.on('notification', (msg) => {
        if (!msg.payload) return;
        try {
          if (msg.channel === PG_NOTIFY_CHANNELS.TELEMETRY_ANOMALY) {
            const payload = JSON.parse(msg.payload) as TelemetryAnomalyEventPayload;
            void this.handleTelemetryEventOnce(payload);
          } else if (msg.channel === PG_NOTIFY_CHANNELS.SPECTRAL_ANOMALY) {
            const payload = JSON.parse(msg.payload) as SpectralAnomalyEventPayload;
            void this.handleSpectralEventOnce(payload);
          }
        } catch (err) {
          this.logger.error(
            `Error procesando notificación PG en canal ${msg.channel}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      });

      this.logger.log(
        `📡 Escuchando canales PostgreSQL LISTEN: [${PG_NOTIFY_CHANNELS.TELEMETRY_ANOMALY}, ${PG_NOTIFY_CHANNELS.SPECTRAL_ANOMALY}]`,
      );
    } catch (error) {
      this.logger.error(
        `No se pudo suscribir a los canales LISTEN de PostgreSQL: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  public async handleTelemetryEventOnce(payload: TelemetryAnomalyEventPayload) {
    const dedupKey = `telemetry:${payload.readingId}`;
    if (this.processedEventIds.has(dedupKey)) {
      return null;
    }
    this.registerDedupKey(dedupKey);
    return this.evaluateTelemetryUseCase.execute(payload);
  }

  public async handleSpectralEventOnce(payload: SpectralAnomalyEventPayload) {
    const dedupKey = `spectral:${payload.sceneId}`;
    if (this.processedEventIds.has(dedupKey)) {
      return null;
    }
    this.registerDedupKey(dedupKey);
    return this.evaluateSpectralUseCase.execute(payload);
  }

  private registerDedupKey(key: string): void {
    this.processedEventIds.add(key);
    if (this.processedEventIds.size > 500) {
      const oldest = this.processedEventIds.values().next().value;
      if (oldest) {
        this.processedEventIds.delete(oldest);
      }
    }
  }

  public async onModuleDestroy(): Promise<void> {
    if (this.listenerClient) {
      this.listenerClient.release();
      this.listenerClient = null;
    }
  }
}
