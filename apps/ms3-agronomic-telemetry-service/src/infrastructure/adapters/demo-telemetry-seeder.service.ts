import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
  TELEMETRY_REPOSITORY_PORT,
  TelemetryRepositoryPort,
} from '../../application/ports/out/telemetry-repository.port';
import { IngestTelemetryReadingUseCase } from '../../application/use-cases/ingest-telemetry-reading.use-case';

@Injectable()
export class DemoTelemetrySeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoTelemetrySeederService.name);
  private readonly demoParcelId =
    process.env.DEFAULT_PARCEL_ID ?? '00000000-0000-0000-0000-000000000001';

  constructor(
    @Inject(TELEMETRY_REPOSITORY_PORT)
    private readonly telemetryRepo: TelemetryRepositoryPort,
    private readonly ingestUseCase: IngestTelemetryReadingUseCase,
  ) {}

  public async onApplicationBootstrap(): Promise<void> {
    try {
      const existingCount = await this.telemetryRepo.countReadingsForParcel(this.demoParcelId);
      if (existingCount > 0) {
        this.logger.log(
          `✅ Parcela demo (${this.demoParcelId}) ya cuenta con ${existingCount} lecturas IoT en ms3_telemetry.`,
        );
        return;
      }

      this.logger.log(
        `🌡️ Generando 24 horas de lecturas históricas iniciales para la parcela demo ${this.demoParcelId}...`,
      );
      const now = Date.now();

      for (let hoursAgo = 24; hoursAgo >= 1; hoursAgo--) {
        const ts = new Date(now - hoursAgo * 3600 * 1000);
        const hour = ts.getHours();
        const isDay = hour >= 7 && hour <= 19;
        const radFactor = Math.max(0, Math.sin(((hour - 7) / 12) * Math.PI));

        const ambientTempC = Number(
          (24.0 + 7.5 * Math.sin(((hour - 9) / 24) * 2 * Math.PI)).toFixed(2),
        );
        const relativeHumidityPct = Number(
          (60.0 - 18.0 * Math.sin(((hour - 9) / 24) * 2 * Math.PI)).toFixed(2),
        );
        const soilMoisture20cmPct = Number((31.2 - (24 - hoursAgo) * 0.08).toFixed(2));
        const soilMoisture40cmPct = Number((soilMoisture20cmPct + 3.4).toFixed(2));
        const solarRadiationWm2 = isDay ? Number((860 * radFactor).toFixed(1)) : 0;

        await this.ingestUseCase.execute(
          {
            parcelId: this.demoParcelId,
            sensorNodeCode: 'NODERED-SEED-24H',
            recordedAt: ts.toISOString(),
            ambientTempC,
            relativeHumidityPct,
            soilMoisture20cmPct,
            soilMoisture40cmPct,
            solarRadiationWm2,
          },
          { suppressAlertNotification: true },
        );
      }

      this.logger.log(`✅ 24 lecturas horarias sembradas en ms3_telemetry.sensor_readings.`);
    } catch (error) {
      this.logger.warn(
        `No se pudo ejecutar el auto-seeding inicial de MS3: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
