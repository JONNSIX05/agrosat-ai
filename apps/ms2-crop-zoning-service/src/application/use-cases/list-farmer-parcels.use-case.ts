import { Inject, Injectable } from '@nestjs/common';
import { ParcelZoningMapper, ParcelZoningResponseDto } from '../dtos/parcel-zoning-response.dto';
import {
  PARCEL_POSTGIS_REPOSITORY_PORT,
  ParcelPostgisRepositoryPort,
} from '../ports/out/parcel-postgis-repository.port';

@Injectable()
export class ListFarmerParcelsUseCase {
  constructor(
    @Inject(PARCEL_POSTGIS_REPOSITORY_PORT)
    private readonly parcelRepo: ParcelPostgisRepositoryPort,
  ) {}

  public async execute(farmerId?: string): Promise<{
    parcels: ParcelZoningResponseDto[];
    featureCollection: ReturnType<typeof ParcelZoningMapper.toGeoJsonFeatureCollection>;
  }> {
    const aggregates = farmerId
      ? await this.parcelRepo.findParcelsByFarmerId(farmerId)
      : await this.parcelRepo.findAllParcels();

    return {
      parcels: aggregates.map((p) => ParcelZoningMapper.toResponseDto(p)),
      featureCollection: ParcelZoningMapper.toGeoJsonFeatureCollection(aggregates),
    };
  }
}
