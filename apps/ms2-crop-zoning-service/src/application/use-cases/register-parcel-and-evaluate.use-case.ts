import { Inject, Injectable } from '@nestjs/common';
import { GisGeometryUtil } from '@agrosat/gis-contracts';
import { InvalidParcelPolygonException } from '../../domain/exceptions/zoning-domain.exceptions';
import { WatermelonSuitabilityEvaluatorDomainService } from '../../domain/services/watermelon-suitability-evaluator.domain-service';
import { GeoPolygonVo } from '../../domain/value-objects/geo-polygon.vo';
import { ParcelZoningMapper, ParcelZoningResponseDto } from '../dtos/parcel-zoning-response.dto';
import { RegisterParcelRequestDto } from '../dtos/register-parcel.dto';
import {
  PARCEL_POSTGIS_REPOSITORY_PORT,
  ParcelPostgisRepositoryPort,
} from '../ports/out/parcel-postgis-repository.port';
import {
  SOIL_SUITABILITY_SIMULATOR_PORT,
  SoilSuitabilitySimulatorPort,
} from '../ports/out/soil-suitability-simulator.port';

@Injectable()
export class RegisterParcelAndEvaluateUseCase {
  private readonly evaluator = new WatermelonSuitabilityEvaluatorDomainService();

  constructor(
    @Inject(PARCEL_POSTGIS_REPOSITORY_PORT)
    private readonly parcelRepo: ParcelPostgisRepositoryPort,
    @Inject(SOIL_SUITABILITY_SIMULATOR_PORT)
    private readonly soilSimulator: SoilSuitabilitySimulatorPort,
  ) {}

  public async execute(dto: RegisterParcelRequestDto): Promise<ParcelZoningResponseDto> {
    if (!dto.parcelName || dto.parcelName.trim().length < 2) {
      throw new InvalidParcelPolygonException(
        'El nombre de la parcela debe contener al menos 2 caracteres.',
      );
    }

    const rawPolygon = dto.boundaryGeoJson
      ? dto.boundaryGeoJson
      : dto.vertices && dto.vertices.length >= 3
        ? GisGeometryUtil.fromLatLngVertices(dto.vertices)
        : null;

    if (!rawPolygon) {
      throw new InvalidParcelPolygonException(
        'Debe proporcionar boundaryGeoJson (Polygon) o un arreglo de al menos 3 vertices [{ latitude, longitude }].',
      );
    }

    // 1. Validación de invariantes en el Objeto de Valor del Dominio
    const validatedPolygonVo = GeoPolygonVo.create(rawPolygon);

    const defaultFarmerId =
      dto.farmerId ?? process.env.DEFAULT_FARMER_ID ?? '00000000-0000-0000-0000-000000000010';
    const defaultPlantingDate =
      dto.plantingDate ?? new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10);

    // 2. Persistencia espacial en PostGIS (ST_IsValid, ST_Area(geography), ST_Centroid)
    const parcelAggregate = await this.parcelRepo.createParcelWithPostgisMetrics({
      farmerId: defaultFarmerId,
      parcelName: dto.parcelName.trim(),
      watermelonVariety: dto.watermelonVariety?.trim() || 'Crimson Sweet',
      plantingDate: defaultPlantingDate,
      boundaryGeoJson: validatedPolygonVo.geoJson,
    });

    // 3. Simulación de parámetros edafológicos de la parcela
    const simulatedEdaphic = await this.soilSimulator.simulateSoilParametersForLocation({
      centroidLon: parcelAggregate.centroid.lon,
      centroidLat: parcelAggregate.centroid.lat,
      areaHectares: parcelAggregate.areaHectares,
      overrides: dto.simulatedSoilOverrides,
    });

    // 4. Evaluación pura de Dominio de Aptitud para Siembra de Sandía (0-100%)
    const evaluationReport = this.evaluator.evaluateParcelForWatermelon(
      parcelAggregate.id,
      simulatedEdaphic,
    );

    const savedEvaluation = await this.parcelRepo.saveSoilEvaluation(evaluationReport);
    parcelAggregate.attachSoilEvaluation(savedEvaluation);

    return ParcelZoningMapper.toResponseDto(parcelAggregate);
  }
}
