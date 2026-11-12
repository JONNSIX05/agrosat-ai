import { GeoJsonFeatureCollection, GeoJsonPolygon } from '@agrosat/gis-contracts';
import { WatermelonPhenologicalStageCode } from '@agrosat/service-contracts';
import { SentinelSceneAggregate } from '../../domain/entities/sentinel-scene.aggregate';

export interface SubcellGeoJsonProperties {
  subcellId: string;
  parcelId: string;
  row: number;
  col: number;
  centroid: { lon: number; lat: number };
  ndvi: number;
  evi: number;
  bandB02Blue: number;
  bandB04Red: number;
  bandB08Nir: number;
  vigorLevel: string;
  isStressedCell: boolean;
  fillColorHex: string;
}

export interface SentinelSceneSummaryDto {
  sceneId: string;
  parcelId: string;
  sceneCode: string;
  capturedAt: string;
  daysAfterPlanting: number;
  phenologicalStage: WatermelonPhenologicalStageCode;
  cloudCoverPct: number;
  meanNdvi: number;
  minNdvi: number;
  maxNdvi: number;
  stddevNdvi: number;
  meanEvi: number;
  stressedCellsPct: number;
  totalSubcells: number;
  hasStressPatch: boolean;
  stressPatchMetadata: {
    centerLon: number;
    centerLat: number;
    radiusMeters: number;
    ndviDropMagnitude: number;
    targetMinNdvi: number;
    anomalyCause: string;
  } | null;
}

export interface SentinelSceneGridResponseDto {
  scene: SentinelSceneSummaryDto;
  featureCollection: GeoJsonFeatureCollection<GeoJsonPolygon, SubcellGeoJsonProperties>;
}

export class SentinelSceneMapper {
  public static ndviToColorHex(ndvi: number): string {
    if (ndvi < 0.2) return '#D32F2F';   // Rojo Crítico
    if (ndvi < 0.35) return '#F57C00';  // Naranja Estrés
    if (ndvi < 0.5) return '#FBC02D';   // Amarillo Moderado
    if (ndvi < 0.65) return '#7CB342';  // Verde Claro
    return '#1B5E20';                   // Verde Intenso Óptimo
  }

  public static toSummaryDto(scene: SentinelSceneAggregate): SentinelSceneSummaryDto {
    return {
      sceneId: scene.id,
      parcelId: scene.parcelId,
      sceneCode: scene.sceneCode,
      capturedAt: scene.capturedAt.toISOString(),
      daysAfterPlanting: scene.daysAfterPlanting,
      phenologicalStage: scene.phenologicalStage,
      cloudCoverPct: scene.cloudCoverPct,
      meanNdvi: scene.meanNdvi,
      minNdvi: scene.minNdvi,
      maxNdvi: scene.maxNdvi,
      stddevNdvi: scene.stddevNdvi,
      meanEvi: scene.meanEvi,
      stressedCellsPct: scene.stressedCellsPct,
      totalSubcells: scene.subcells.length,
      hasStressPatch: scene.hasStressPatch,
      stressPatchMetadata: scene.stressPatchMetadata ?? null,
    };
  }

  public static toGridResponseDto(scene: SentinelSceneAggregate): SentinelSceneGridResponseDto {
    return {
      scene: this.toSummaryDto(scene),
      featureCollection: {
        type: 'FeatureCollection',
        features: scene.subcells.map((cell) => ({
          type: 'Feature',
          id: cell.id,
          geometry: cell.cellGeoJson,
          properties: {
            subcellId: cell.id,
            parcelId: cell.parcelId,
            row: cell.cellRow,
            col: cell.cellCol,
            centroid: cell.centroid,
            ndvi: cell.ndvi,
            evi: cell.evi,
            bandB02Blue: cell.spectralBands.b02Blue,
            bandB04Red: cell.spectralBands.b04Red,
            bandB08Nir: cell.spectralBands.b08Nir,
            vigorLevel: cell.vigorLevel,
            isStressedCell: cell.isStressedCell,
            fillColorHex: this.ndviToColorHex(cell.ndvi),
          },
        })),
      },
    };
  }
}
