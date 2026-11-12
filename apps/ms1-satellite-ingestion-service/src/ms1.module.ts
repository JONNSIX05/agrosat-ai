import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@agrosat/shared-kernel';
import { PARCEL_GEOMETRY_PROVIDER_PORT } from './application/ports/out/parcel-geometry-provider.port';
import { SENTINEL_SCENE_REPOSITORY_PORT } from './application/ports/out/sentinel-scene-repository.port';
import { SENTINEL_SPATIAL_SIMULATOR_PORT } from './application/ports/out/sentinel-spatial-simulator.port';
import { SPECTRAL_ANOMALY_NOTIFIER_PORT } from './application/ports/out/spectral-anomaly-notifier.port';
import { GetLatestParcelGridUseCase } from './application/use-cases/get-latest-parcel-grid.use-case';
import { GetParcelNdviTimeseriesUseCase } from './application/use-cases/get-parcel-ndvi-timeseries.use-case';
import { SimulateSentinelPassUseCase } from './application/use-cases/simulate-sentinel-pass.use-case';
import { DemoSatelliteHistorySeederService } from './infrastructure/adapters/demo-satellite-history-seeder.service';
import { ParcelGeometryHttpAdapter } from './infrastructure/adapters/parcel-geometry-http.adapter';
import { PgNotifySpectralAnomalyAdapter } from './infrastructure/adapters/pg-notify-spectral-anomaly.adapter';
import { PostgisSceneRepository } from './infrastructure/adapters/postgis-scene.repository';
import { SimulatedSentinelPostgisAdapter } from './infrastructure/adapters/simulated-sentinel-postgis.adapter';
import { SatelliteIngestionController } from './infrastructure/controllers/satellite-ingestion.controller';

@Module({
  imports: [PostgresDatabaseModule],
  controllers: [SatelliteIngestionController],
  providers: [
    SimulateSentinelPassUseCase,
    GetLatestParcelGridUseCase,
    GetParcelNdviTimeseriesUseCase,
    DemoSatelliteHistorySeederService,
    {
      provide: SENTINEL_SPATIAL_SIMULATOR_PORT,
      useClass: SimulatedSentinelPostgisAdapter,
    },
    {
      provide: SENTINEL_SCENE_REPOSITORY_PORT,
      useClass: PostgisSceneRepository,
    },
    {
      provide: PARCEL_GEOMETRY_PROVIDER_PORT,
      useClass: ParcelGeometryHttpAdapter,
    },
    {
      provide: SPECTRAL_ANOMALY_NOTIFIER_PORT,
      useClass: PgNotifySpectralAnomalyAdapter,
    },
  ],
})
export class Ms1SatelliteIngestionModule {}
