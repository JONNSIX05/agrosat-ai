import { RawSimulatedEdaphicParams } from '../../domain/services/watermelon-suitability-evaluator.domain-service';
import { SimulatedSoilOverridesDto } from '../dtos/register-parcel.dto';

export const SOIL_SUITABILITY_SIMULATOR_PORT = Symbol('SOIL_SUITABILITY_SIMULATOR_PORT');

export interface SoilSuitabilitySimulatorPort {
  /**
   * Simula variables edafológicas y fisiográficas (textura, pH, drenaje, altitud, radiación, pendiente)
   * de forma determinista según la ubicación geográfica del centroide o aplicando overrides de prueba.
   */
  simulateSoilParametersForLocation(params: {
    centroidLon: number;
    centroidLat: number;
    areaHectares: number;
    overrides?: SimulatedSoilOverridesDto;
  }): Promise<RawSimulatedEdaphicParams>;
}
