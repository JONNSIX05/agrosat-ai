import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ParcelSuitabilityContextDto } from '@agrosat/service-contracts';
import {
  RegisterParcelRequestDto,
  SimulatedSoilOverridesDto,
} from '../../application/dtos/register-parcel.dto';
import { GetParcelDetailsUseCase } from '../../application/use-cases/get-parcel-details.use-case';
import { ListFarmerParcelsUseCase } from '../../application/use-cases/list-farmer-parcels.use-case';
import { ReEvaluateParcelSuitabilityUseCase } from '../../application/use-cases/re-evaluate-parcel-suitability.use-case';
import { RegisterParcelAndEvaluateUseCase } from '../../application/use-cases/register-parcel-and-evaluate.use-case';

@Controller()
export class CropZoningController {
  constructor(
    private readonly registerParcelUseCase: RegisterParcelAndEvaluateUseCase,
    private readonly getParcelDetailsUseCase: GetParcelDetailsUseCase,
    private readonly listFarmerParcelsUseCase: ListFarmerParcelsUseCase,
    private readonly reEvaluateSuitabilityUseCase: ReEvaluateParcelSuitabilityUseCase,
  ) {}

  @Get('health')
  public healthCheck() {
    return {
      service: 'ms2-crop-zoning-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // ENDPOINTS PÚBLICOS (Consumidos vía agrosat_gateway :18080)
  // ==========================================================================

  @Post('api/v1/zoning/parcels')
  public async registerParcel(@Body() body: RegisterParcelRequestDto) {
    return this.registerParcelUseCase.execute(body);
  }

  @Get('api/v1/zoning/parcels')
  public async listAllParcels(@Query('farmerId') farmerId?: string) {
    return this.listFarmerParcelsUseCase.execute(farmerId);
  }

  @Get('api/v1/zoning/parcels/:parcelId')
  public async getParcelById(@Param('parcelId') parcelId: string) {
    return this.getParcelDetailsUseCase.execute(parcelId);
  }

  @Get('api/v1/zoning/farmers/:farmerId/parcels')
  public async listParcelsByFarmer(@Param('farmerId') farmerId: string) {
    return this.listFarmerParcelsUseCase.execute(farmerId);
  }

  @Post('api/v1/zoning/parcels/:parcelId/re-evaluate')
  public async reEvaluateParcel(
    @Param('parcelId') parcelId: string,
    @Body() body?: { simulatedSoilOverrides?: SimulatedSoilOverridesDto },
  ) {
    return this.reEvaluateSuitabilityUseCase.execute({
      parcelId,
      simulatedSoilOverrides: body?.simulatedSoilOverrides,
    });
  }

  // ==========================================================================
  // ENDPOINTS INTERNOS (Consumidos por MS1 Satellite y MS4 Virtual Agronomist)
  // ==========================================================================

  @Get('internal/v1/parcels/:parcelId/geometry')
  public async getInternalParcelGeometry(@Param('parcelId') parcelId: string) {
    const parcel = await this.getParcelDetailsUseCase.execute(parcelId);
    return {
      parcelId: parcel.parcelId,
      parcelName: parcel.parcelName,
      plantingDate: parcel.plantingDate,
      areaHectares: parcel.areaHectares,
      centroid: parcel.centroid,
      boundaryGeoJson: parcel.boundaryGeoJson,
    };
  }

  @Get('internal/v1/parcels/:parcelId/suitability')
  public async getInternalParcelSuitability(
    @Param('parcelId') parcelId: string,
  ): Promise<ParcelSuitabilityContextDto> {
    const p = await this.getParcelDetailsUseCase.execute(parcelId);
    return {
      parcelId: p.parcelId,
      farmerId: p.farmerId,
      parcelName: p.parcelName,
      watermelonVariety: p.watermelonVariety,
      plantingDate: p.plantingDate,
      areaHectares: p.areaHectares,
      centroid: p.centroid,
      boundaryGeoJson: p.boundaryGeoJson,
      soilEvaluation: p.soilSuitability
        ? {
            soilTexture: p.soilSuitability.soilTexture,
            phLevel: p.soilSuitability.phLevel,
            drainageLevel: p.soilSuitability.drainageLevel,
            altitudeMsnm: p.soilSuitability.altitudeMsnm,
            solarRadiationMjm2: p.soilSuitability.solarRadiationMjm2,
            slopePct: p.soilSuitability.slopePct,
            viabilityScorePct: p.soilSuitability.viabilityScorePct,
            suitabilityCategory: p.soilSuitability.suitabilityCategory,
            limitingFactors: p.soilSuitability.limitingFactors,
          }
        : {
            soilTexture: 'FRANCO_ARENOSA',
            phLevel: 6.4,
            drainageLevel: 'OPTIMO_BUENO',
            altitudeMsnm: 420,
            solarRadiationMjm2: 24.8,
            slopePct: 1.8,
            viabilityScorePct: 94.0,
            suitabilityCategory: 'ALTAMENTE_APTO',
            limitingFactors: [],
          },
    };
  }
}
