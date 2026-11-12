import { GeoJsonFeatureCollection, GeoJsonPolygon } from '@agrosat/gis-contracts';
import { ParcelAggregate } from '../../domain/entities/parcel.aggregate';

export interface ParcelZoningResponseDto {
  parcelId: string;
  farmerId: string;
  parcelName: string;
  watermelonVariety: string;
  plantingDate: string;
  areaHectares: number;
  perimeterMeters: number;
  centroid: {
    lon: number;
    lat: number;
  };
  boundaryGeoJson: GeoJsonPolygon;
  soilSuitability: {
    evaluationId: string;
    evaluatedAt: string;
    soilTexture: string;
    phLevel: number;
    drainageLevel: string;
    altitudeMsnm: number;
    solarRadiationMjm2: number;
    slopePct: number;
    viabilityScorePct: number;
    suitabilityCategory: string;
    breakdown: {
      textureScore: number;
      phScore: number;
      drainageScore: number;
      radiationScore: number;
      topographyScore: number;
      recommendations: string[];
    };
    limitingFactors: string[];
  } | null;
}

export class ParcelZoningMapper {
  public static toResponseDto(parcel: ParcelAggregate): ParcelZoningResponseDto {
    const evalReport = parcel.latestEvaluation;

    return {
      parcelId: parcel.id,
      farmerId: parcel.farmerId,
      parcelName: parcel.parcelName,
      watermelonVariety: parcel.watermelonVariety,
      plantingDate: parcel.plantingDate,
      areaHectares: parcel.areaHectares,
      perimeterMeters: parcel.perimeterMeters,
      centroid: parcel.centroid,
      boundaryGeoJson: parcel.boundaryPolygon.geoJson,
      soilSuitability: evalReport
        ? {
            evaluationId: evalReport.id,
            evaluatedAt: evalReport.evaluatedAt.toISOString(),
            soilTexture: evalReport.soilTexture.value,
            phLevel: evalReport.soilPh.value,
            drainageLevel: evalReport.drainage.value,
            altitudeMsnm: evalReport.topography.altitudeMsnm,
            solarRadiationMjm2: evalReport.solarRadiation.value,
            slopePct: evalReport.topography.slopePct,
            viabilityScorePct: evalReport.viabilityScore.viabilityScorePct,
            suitabilityCategory: evalReport.viabilityScore.suitabilityCategory,
            breakdown: evalReport.viabilityScore.breakdown,
            limitingFactors: evalReport.viabilityScore.limitingFactors,
          }
        : null,
    };
  }

  public static toGeoJsonFeatureCollection(
    parcels: ParcelAggregate[],
  ): GeoJsonFeatureCollection<GeoJsonPolygon, Record<string, unknown>> {
    return {
      type: 'FeatureCollection',
      features: parcels.map((p) => {
        const dto = this.toResponseDto(p);
        return {
          type: 'Feature',
          id: p.id,
          geometry: p.boundaryPolygon.geoJson,
          properties: {
            parcelId: dto.parcelId,
            parcelName: dto.parcelName,
            watermelonVariety: dto.watermelonVariety,
            plantingDate: dto.plantingDate,
            areaHectares: dto.areaHectares,
            centroid: dto.centroid,
            viabilityScorePct: dto.soilSuitability?.viabilityScorePct ?? null,
            suitabilityCategory: dto.soilSuitability?.suitabilityCategory ?? null,
            soilTexture: dto.soilSuitability?.soilTexture ?? null,
            phLevel: dto.soilSuitability?.phLevel ?? null,
          },
        };
      }),
    };
  }
}
