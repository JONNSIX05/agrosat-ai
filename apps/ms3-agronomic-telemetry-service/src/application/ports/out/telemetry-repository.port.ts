import { TelemetrySummaryContextDto } from '@agrosat/service-contracts';
import { TelemetryReadingEntity } from '../../../domain/entities/telemetry-reading.entity';
import { TelemetryReadingResponseDto } from '../../dtos/ingest-telemetry.dto';

export const TELEMETRY_REPOSITORY_PORT = Symbol('TELEMETRY_REPOSITORY_PORT');

export interface TelemetryRepositoryPort {
  saveReading(reading: TelemetryReadingEntity): Promise<TelemetryReadingEntity>;
  getClimaticSummaryAndHistory(
    parcelId: string,
    limitReadings?: number,
  ): Promise<{
    summary: TelemetrySummaryContextDto;
    readings: TelemetryReadingResponseDto[];
  }>;
  countReadingsForParcel(parcelId: string): Promise<number>;
}
