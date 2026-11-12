import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { GetParcelNdviTimeseriesUseCase } from '../../application/use-cases/get-parcel-ndvi-timeseries.use-case';
import { SimulateSentinelPassUseCase } from '../../application/use-cases/simulate-sentinel-pass.use-case';

@Injectable()
export class DemoSatelliteHistorySeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoSatelliteHistorySeederService.name);
  private readonly demoParcelId =
    process.env.DEFAULT_PARCEL_ID ?? '00000000-0000-0000-0000-000000000001';

  constructor(
    private readonly timeseriesUseCase: GetParcelNdviTimeseriesUseCase,
    private readonly simulatePassUseCase: SimulateSentinelPassUseCase,
  ) {}

  public async onApplicationBootstrap(): Promise<void> {
    try {
      const existing = await this.timeseriesUseCase.execute(this.demoParcelId, 5);
      if (existing.totalPasses > 0) {
        this.logger.log(
          `✅ Parcela demo (${this.demoParcelId}) ya cuenta con ${existing.totalPasses} escenas satelitales en PostGIS.`,
        );
        return;
      }

      this.logger.log(
        `🛰️ Generando evolución fenológica inicial (DAS 12, 26, 38, 48) en PostGIS para parcela demo ${this.demoParcelId}...`,
      );
      for (const das of [12, 26, 38, 48]) {
        await this.simulatePassUseCase.execute(this.demoParcelId, {
          daysAfterPlanting: das,
          simulationSeed: das * 17,
        });
      }
      this.logger.log(
        `✅ 4 escenas Sentinel-2 simuladas y grillas PostGIS creadas exitosamente para la parcela demo.`,
      );
    } catch (error) {
      this.logger.warn(
        `No se pudo ejecutar el auto-seeding inicial de MS1: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
