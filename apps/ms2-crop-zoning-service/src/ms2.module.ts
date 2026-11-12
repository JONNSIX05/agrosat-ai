import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@agrosat/shared-kernel';
import { PARCEL_POSTGIS_REPOSITORY_PORT } from './application/ports/out/parcel-postgis-repository.port';
import { SOIL_SUITABILITY_SIMULATOR_PORT } from './application/ports/out/soil-suitability-simulator.port';
import { GetParcelDetailsUseCase } from './application/use-cases/get-parcel-details.use-case';
import { ListFarmerParcelsUseCase } from './application/use-cases/list-farmer-parcels.use-case';
import { ReEvaluateParcelSuitabilityUseCase } from './application/use-cases/re-evaluate-parcel-suitability.use-case';
import { RegisterParcelAndEvaluateUseCase } from './application/use-cases/register-parcel-and-evaluate.use-case';
import { PostgisParcelRepository } from './infrastructure/adapters/postgis-parcel.repository';
import { SimulatedSoilSuitabilityAdapter } from './infrastructure/adapters/simulated-soil-suitability.adapter';
import { CropZoningController } from './infrastructure/controllers/crop-zoning.controller';

@Module({
  imports: [PostgresDatabaseModule],
  controllers: [CropZoningController],
  providers: [
    RegisterParcelAndEvaluateUseCase,
    GetParcelDetailsUseCase,
    ListFarmerParcelsUseCase,
    ReEvaluateParcelSuitabilityUseCase,
    {
      provide: PARCEL_POSTGIS_REPOSITORY_PORT,
      useClass: PostgisParcelRepository,
    },
    {
      provide: SOIL_SUITABILITY_SIMULATOR_PORT,
      useClass: SimulatedSoilSuitabilityAdapter,
    },
  ],
})
export class Ms2CropZoningModule {}
