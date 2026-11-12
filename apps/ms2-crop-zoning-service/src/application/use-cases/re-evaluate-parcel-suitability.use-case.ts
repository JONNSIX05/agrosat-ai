import { Inject, Injectable } from '@nestjs/common';
import { ParcelNotFoundException } from '../../domain/exceptions/zoning-domain.exceptions';
import { WatermelonSuitabilityEvaluatorDomainService } from '../../domain/services/watermelon-suitability-evaluator.domain-service';
import { ParcelZoningMapper, ParcelZoningResponseDto } from '../dtos/parcel-zoning-response.dto';
import { ReEvaluateParcelRequestDto } from '../dtos/register-parcel.dto';
import {
  PARCEL_POSTGIS_REPOSITORY_PORT,
  ParcelPostgisRepositoryPort,
} from '../ports/out/parcel-postgis-repository.port';
import {
  SOIL_SUITABILITY_SIMULATOR_PORT,
  SoilSuitabilitySimulatorPort,
} from '../ports/out/soil-suitability-simulator.port';

@Injectable()
export class ReEvaluateParcelSuitabilityUseCase {
  private readonly evaluator = new WatermelonSuitabilityEvaluatorDomainService();

  constructor(
    @Inject(PARCEL_POSTGIS_REPOSITORY_PORT)
    private readonly parcelRepo: ParcelPostgisRepositoryPort,
    @Inject(SOIL_SUITABILITY_SIMULATOR_PORT)
    private readonly soilSimulator: SoilSuitabilitySimulatorPort,
  ) {}

  public async execute(dto: ReEvaluateParcelRequestDto): Promise<ParcelZoningResponseDto> {
    const parcel = await this.parcelRepo.findParcelById(dto.parcelId);
    if (!parcel) {
      throw new ParcelNotFoundException(dto.parcelId);
    }

    const simulatedEdaphic = await this.soilSimulator.simulateSoilParametersForLocation({
      centroidLon: parcel.centroid.lon,
      centroidLat: parcel.centroid.lat,
      areaHectares: parcel.areaHectares,
      overrides: dto.simulatedSoilOverrides,
    });

    const newReport = this.evaluator.evaluateParcelForWatermelon(parcel.id, simulatedEdaphic);
    const savedReport = await this.parcelRepo.saveSoilEvaluation(newReport);
    parcel.attachSoilEvaluation(savedReport);

    return ParcelZoningMapper.toResponseDto(parcel);
  }
}
