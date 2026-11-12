import { RawSimulatedEdaphicParams } from '../../../domain/services/watermelon-suitability-evaluator.domain-service';
import { SimulatedSoilOverridesDto } from '../../dtos/register-parcel.dto';

export const SOIL_SUITABILITY_SIMULATOR_PORT = Symbol('SOIL_SUITABILITY_SIMULATOR_PORT');

export interface SoilSuitabilitySimulatorPort {
  simulateSoilParametersForLocation(params: {
    centroidLon: number;
    centroidLat: number;
    areaHectares: number;
    overrides?: SimulatedSoilOverridesDto;
  }): Promise<RawSimulatedEdaphicParams>;
}
