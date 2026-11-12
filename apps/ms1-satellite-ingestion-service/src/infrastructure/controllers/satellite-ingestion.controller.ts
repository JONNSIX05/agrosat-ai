import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { LatestSatelliteSceneContextDto } from '@agrosat/service-contracts';
import { SimulateSentinelPassRequestDto } from '../../application/dtos/simulate-pass.dto';
import { GetLatestParcelGridUseCase } from '../../application/use-cases/get-latest-parcel-grid.use-case';
import { GetParcelNdviTimeseriesUseCase } from '../../application/use-cases/get-parcel-ndvi-timeseries.use-case';
import { SimulateSentinelPassUseCase } from '../../application/use-cases/simulate-sentinel-pass.use-case';

@Controller()
export class SatelliteIngestionController {
  constructor(
    private readonly simulatePassUseCase: SimulateSentinelPassUseCase,
    private readonly getLatestGridUseCase: GetLatestParcelGridUseCase,
    private readonly getTimeseriesUseCase: GetParcelNdviTimeseriesUseCase,
  ) {}

  @Get('health')
  public healthCheck() {
    return {
      service: 'ms1-satellite-ingestion-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // ENDPOINTS PÚBLICOS (Consumidos vía agrosat_gateway :18080 y Node-RED)
  // ==========================================================================

  @Post('api/v1/satellite/parcels/:parcelId/simulate-pass')
  public async simulateSatellitePass(
    @Param('parcelId') parcelId: string,
    @Body() body?: SimulateSentinelPassRequestDto,
  ) {
    return this.simulatePassUseCase.execute(parcelId, body ?? {});
  }

  @Get('api/v1/satellite/parcels/:parcelId/latest-grid')
  public async getLatestParcelGrid(@Param('parcelId') parcelId: string) {
    return this.getLatestGridUseCase.execute(parcelId);
  }

  @Get('api/v1/satellite/scenes/:sceneId/grid')
  public async getSceneGridById(@Param('sceneId') sceneId: string) {
    return this.getLatestGridUseCase.executeBySceneId(sceneId);
  }

  @Get('api/v1/satellite/parcels/:parcelId/heatmap')
  public async getParcelHeatmapAlias(@Param('parcelId') parcelId: string) {
    return this.getLatestGridUseCase.execute(parcelId);
  }

  @Get('api/v1/satellite/parcels/:parcelId/timeseries')
  public async getParcelNdviTimeseries(
    @Param('parcelId') parcelId: string,
    @Query('limit') limit?: string,
  ) {
    return this.getTimeseriesUseCase.execute(parcelId, limit ? Number(limit) : 30);
  }

  // ==========================================================================
  // ENDPOINTS INTERNOS (Consumidos por MS4 Virtual Agronomist RAG)
  // ==========================================================================

  @Get('internal/v1/scenes/latest/:parcelId')
  public async getInternalLatestSceneContext(
    @Param('parcelId') parcelId: string,
  ): Promise<LatestSatelliteSceneContextDto> {
    const [latestGrid, timeseries] = await Promise.all([
      this.getLatestGridUseCase.execute(parcelId),
      this.getTimeseriesUseCase.execute(parcelId, 5),
    ]);

    const s = latestGrid.scene;
    return {
      sceneId: s.sceneId,
      parcelId: s.parcelId,
      capturedAt: s.capturedAt,
      daysAfterPlanting: s.daysAfterPlanting,
      phenologicalStage: s.phenologicalStage,
      meanNdvi: s.meanNdvi,
      minNdvi: s.minNdvi,
      maxNdvi: s.maxNdvi,
      meanEvi: s.meanEvi,
      ndviDelta: timeseries.ndviDeltaFromPrevious,
      stressedCellsPct: s.stressedCellsPct,
      hasStressPatch: s.hasStressPatch,
      stressPatchMetadata: s.stressPatchMetadata
        ? {
            centerLon: s.stressPatchMetadata.centerLon,
            centerLat: s.stressPatchMetadata.centerLat,
            radiusMeters: s.stressPatchMetadata.radiusMeters,
            ndviDropMagnitude: s.stressPatchMetadata.ndviDropMagnitude,
            anomalyCause: s.stressPatchMetadata.anomalyCause,
          }
        : undefined,
    };
  }
}
