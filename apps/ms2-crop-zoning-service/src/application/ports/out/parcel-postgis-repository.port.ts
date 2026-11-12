import { GeoJsonPolygon } from '@agrosat/gis-contracts';
import { ParcelAggregate } from '../../domain/entities/parcel.aggregate';
import { SoilEvaluationReportEntity } from '../../domain/entities/soil-evaluation-report.entity';

export const PARCEL_POSTGIS_REPOSITORY_PORT = Symbol('PARCEL_POSTGIS_REPOSITORY_PORT');

export interface CreateParcelSpatialPersistenceParams {
  farmerId: string;
  parcelName: string;
  watermelonVariety: string;
  plantingDate: string;
  boundaryGeoJson: GeoJsonPolygon;
}

export interface ParcelPostgisRepositoryPort {
  /**
   * Valida topología con ST_IsValid en PostGIS, inserta el polígono SRID 4326 y retorna
   * el agregado con area_hectares (ST_Area geography), perimeter_meters y centroide reales.
   */
  createParcelWithPostgisMetrics(
    params: CreateParcelSpatialPersistenceParams,
  ): Promise<ParcelAggregate>;

  saveSoilEvaluation(report: SoilEvaluationReportEntity): Promise<SoilEvaluationReportEntity>;

  findParcelById(parcelId: string): Promise<ParcelAggregate | null>;

  findParcelsByFarmerId(farmerId: string): Promise<ParcelAggregate[]>;

  findAllParcels(): Promise<ParcelAggregate[]>;
}
