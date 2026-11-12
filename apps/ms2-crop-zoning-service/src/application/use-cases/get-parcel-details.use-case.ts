import { Inject, Injectable } from '@nestjs/common';
import { ParcelNotFoundException } from '../../domain/exceptions/zoning-domain.exceptions';
import { ParcelZoningMapper, ParcelZoningResponseDto } from '../dtos/parcel-zoning-response.dto';
import {
  PARCEL_POSTGIS_REPOSITORY_PORT,
  ParcelPostgisRepositoryPort,
} from '../ports/out/parcel-postgis-repository.port';

@Injectable()
export class GetParcelDetailsUseCase {
  constructor(
    @Inject(PARCEL_POSTGIS_REPOSITORY_PORT)
    private readonly parcelRepo: ParcelPostgisRepositoryPort,
  ) {}

  public async execute(parcelId: string): Promise<ParcelZoningResponseDto> {
    const parcel = await this.parcelRepo.findParcelById(parcelId);
    if (!parcel) {
      throw new ParcelNotFoundException(parcelId);
    }
    return ParcelZoningMapper.toResponseDto(parcel);
  }
}
