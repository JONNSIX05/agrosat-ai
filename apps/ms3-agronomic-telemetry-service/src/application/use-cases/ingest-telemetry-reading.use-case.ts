import { Inject, Injectable, Logger } from '@nestjs/common';
import { TelemetryReadingEntity } from '../../domain/entities/telemetry-reading.entity';
import { AmbientClimateVo } from '../../domain/value-objects/ambient-climate.vo';
import { DualDepthSoilMoistureVo } from '../../domain/value-objects/dual-depth-soil-moisture.vo';
import {
  IngestTelemetryReadingRequestDto,
  TelemetryReadingResponseDto,
} from '../dtos/ingest-telemetry.dto';
import {
  TELEMETRY_ANOMALY_PUBLISHER_PORT,
  TelemetryAnomalyPublisherPort,
} from '../ports/out/telemetry-anomaly-publisher.port';
import {
  TELEMETRY_REPOSITORY_PORT,
  TelemetryRepositoryPort,
} from '../ports/out/telemetry-repository.port';

@Injectable()
export class IngestTelemetryReadingUseCase {
  private readonly logger = new Logger(IngestTelemetryReadingUseCase.name);

  constructor(
    @Inject(TELEMETRY_REPOSITORY_PORT)
    private readonly telemetryRepo: TelemetryRepositoryPort,
    @Inject(TELEMETRY_ANOMALY_PUBLISHER_PORT)
    private readonly anomalyPublisher: TelemetryAnomalyPublisherPort,
  ) {}

  public async execute(
    dto: IngestTelemetryReadingRequestDto,
    options: { suppressAlertNotification?: boolean } = {},
  ): Promise<TelemetryReadingResponseDto> {
    const parcelId =
      dto.parcelId ?? process.env.DEFAULT_PARCEL_ID ?? '00000000-0000-0000-0000-000000000001';

    const resolvedTempC =
      dto.ambientTempC !== undefined ? Number(dto.ambientTempC) : Number(dto.temperatureC);

    const climateVo = AmbientClimateVo.create({
      ambientTempC: resolvedTempC,
      relativeHumidityPct: Number(dto.relativeHumidityPct),
      solarRadiationWm2: Number(dto.solarRadiationWm2 ?? 450),
    });

    const moisture20 = Number(dto.soilMoisture20cmPct);
    const moisture40 =
      dto.soilMoisture40cmPct !== undefined
        ? Number(dto.soilMoisture40cmPct)
        : Math.min(95, Number((moisture20 + 3.2).toFixed(2)));

    const soilMoistureVo = DualDepthSoilMoistureVo.create({
      soilMoisture20cmPct: moisture20,
      soilMoisture40cmPct: moisture40,
    });

    const readingEntity = TelemetryReadingEntity.create({
      parcelId,
      sensorNodeCode: dto.sensorNodeCode,
      recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
      climate: climateVo,
      soilMoisture: soilMoistureVo,
    });

    const saved = await this.telemetryRepo.saveReading(readingEntity);

    if (saved.isAnomalyFlagged && !options.suppressAlertNotification) {
      this.logger.warn(
        `🌡️💧 Lectura crítica detectada en parcela ${parcelId}: Temp=${saved.climate.ambientTempC}°C, Humedad20cm=${saved.soilMoisture.soilMoisture20cmPct}%`,
      );
      await this.anomalyPublisher.publishTelemetryAnomaly({
        parcelId: saved.parcelId,
        readingId: saved.id,
        recordedAt: saved.recordedAt.toISOString(),
        ambientTempC: saved.climate.ambientTempC,
        relativeHumidityPct: saved.climate.relativeHumidityPct,
        soilMoisture20cmPct: saved.soilMoisture.soilMoisture20cmPct,
        soilMoisture40cmPct: saved.soilMoisture.soilMoisture40cmPct,
        solarRadiationWm2: saved.climate.solarRadiationWm2,
        vpdKpa: saved.climate.vpdKpa,
      });
    }

    return {
      readingId: saved.id,
      parcelId: saved.parcelId,
      sensorNodeCode: saved.sensorNodeCode,
      recordedAt: saved.recordedAt.toISOString(),
      ambientTempC: saved.climate.ambientTempC,
      relativeHumidityPct: saved.climate.relativeHumidityPct,
      soilMoisture20cmPct: saved.soilMoisture.soilMoisture20cmPct,
      soilMoisture40cmPct: saved.soilMoisture.soilMoisture40cmPct,
      solarRadiationWm2: saved.climate.solarRadiationWm2,
      vpdKpa: saved.climate.vpdKpa,
      isAnomalyFlagged: saved.isAnomalyFlagged,
    };
  }
}
