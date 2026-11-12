import { Injectable } from '@nestjs/common';
import { SimulatedSoilOverridesDto } from '../../application/dtos/register-parcel.dto';
import { SoilSuitabilitySimulatorPort } from '../../application/ports/out/soil-suitability-simulator.port';
import { RawSimulatedEdaphicParams } from '../../domain/services/watermelon-suitability-evaluator.domain-service';

@Injectable()
export class SimulatedSoilSuitabilityAdapter implements SoilSuitabilitySimulatorPort {
  /**
   * Genera de forma determinista y espacialmente coherente los parámetros de suelo y fisiografía
   * para el cultivo de sandía a partir del centroide GPS (lon, lat), permitiendo overrides manuales.
   */
  public async simulateSoilParametersForLocation(params: {
    centroidLon: number;
    centroidLat: number;
    areaHectares: number;
    overrides?: SimulatedSoilOverridesDto;
  }): Promise<RawSimulatedEdaphicParams> {
    const { centroidLon, centroidLat, overrides } = params;

    // Función pseudo-aleatoria espacial determinista en [0, 1) basada en coordenadas
    const spatialHash = (salt: number): number => {
      const x = Math.sin(centroidLon * 127.1 + centroidLat * 311.7 + salt * 74.7) * 43758.5453;
      return x - Math.floor(x);
    };

    const h1 = spatialHash(1);
    const h2 = spatialHash(2);
    const h3 = spatialHash(3);
    const h4 = spatialHash(4);
    const h5 = spatialHash(5);

    // 1. Textura predominante en zonas productoras de sandía
    let simulatedTexture: 'FRANCO_ARENOSA' | 'FRANCA' | 'ARENOSA' | 'ARCILLOSA';
    if (h1 < 0.65) {
      simulatedTexture = 'FRANCO_ARENOSA';
    } else if (h1 < 0.85) {
      simulatedTexture = 'FRANCA';
    } else if (h1 < 0.94) {
      simulatedTexture = 'ARENOSA';
    } else {
      simulatedTexture = 'ARCILLOSA';
    }

    // 2. pH simulado centrado alrededor del óptimo de sandía (6.0 - 6.8)
    const simulatedPh = Number((5.85 + h2 * 1.15).toFixed(2));

    // 3. Drenaje correlacionado físicamente con la textura
    const finalTexture = overrides?.soilTexture ?? simulatedTexture;
    let simulatedDrainage: 'OPTIMO_BUENO' | 'MODERADO' | 'DEFICIENTE';
    if (finalTexture === 'FRANCO_ARENOSA' || finalTexture === 'ARENOSA') {
      simulatedDrainage = 'OPTIMO_BUENO';
    } else if (finalTexture === 'FRANCA') {
      simulatedDrainage = h3 < 0.8 ? 'OPTIMO_BUENO' : 'MODERADO';
    } else {
      simulatedDrainage = 'DEFICIENTE';
    }

    // 4. Altitud (m.s.n.m.), Radiación Solar (MJ/m²/día) y Pendiente (%)
    const simulatedAltitude = Number((180 + h3 * 650).toFixed(1));
    const simulatedRadiation = Number((22.0 + h4 * 5.8).toFixed(2));
    const simulatedSlope = Number((0.8 + h5 * 3.2).toFixed(2));

    return {
      soilTexture: finalTexture,
      phLevel: overrides?.phLevel ?? simulatedPh,
      drainageLevel: overrides?.drainageLevel ?? simulatedDrainage,
      altitudeMsnm: overrides?.altitudeMsnm ?? simulatedAltitude,
      solarRadiationMjm2: overrides?.solarRadiationMjm2 ?? simulatedRadiation,
      slopePct: overrides?.slopePct ?? simulatedSlope,
    };
  }
}
