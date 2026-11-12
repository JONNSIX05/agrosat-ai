import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@agrosat/shared-kernel';
import { TELEMETRY_ANOMALY_PUBLISHER_PORT } from './application/ports/out/telemetry-anomaly-publisher.port';
import { TELEMETRY_REPOSITORY_PORT } from './application/ports/out/telemetry-repository.port';
import { GetParcelTelemetryHistoryUseCase } from './application/use-cases/get-parcel-telemetry-history.use-case';
import { IngestTelemetryReadingUseCase } from './application/use-cases/ingest-telemetry-reading.use-case';
import { DemoTelemetrySeederService } from './infrastructure/adapters/demo-telemetry-seeder.service';
import { PgNotifyTelemetryAnomalyAdapter } from './infrastructure/adapters/pg-notify-telemetry-anomaly.adapter';
import { PostgresTelemetryRepository } from './infrastructure/adapters/postgres-telemetry.repository';
import { TelemetryController } from './infrastructure/controllers/telemetry.controller';

@Module({
  imports: [PostgresDatabaseModule],
  controllers: [TelemetryController],
  providers: [
    IngestTelemetryReadingUseCase,
    GetParcelTelemetryHistoryUseCase,
    DemoTelemetrySeederService,
    {
      provide: TELEMETRY_REPOSITORY_PORT,
      useClass: PostgresTelemetryRepository,
    },
    {
      provide: TELEMETRY_ANOMALY_PUBLISHER_PORT,
      useClass: PgNotifyTelemetryAnomalyAdapter,
    },
  ],
})
export class Ms3AgronomicTelemetryModule {}
