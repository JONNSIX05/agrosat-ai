import { Injectable } from '@nestjs/common';
import { PostgresService } from '@agrosat/shared-kernel';
import { GeoJsonPolygon } from '@agrosat/gis-contracts';
import {
  CreateParcelSpatialPersistenceParams,
  ParcelPostgisRepositoryPort,
} from '../../application/ports/out/parcel-postgis-repository.port';
import { ParcelAggregate } from '../../domain/entities/parcel.aggregate';
import { SoilEvaluationReportEntity } from '../../domain/entities/soil-evaluation-report.entity';
import { InvalidParcelPolygonException } from '../../domain/exceptions/zoning-domain.exceptions';
import { AltitudeAndSlopeVo } from '../../domain/value-objects/altitude-and-slope.vo';
import { DrainageCapacityVo } from '../../domain/value-objects/drainage-capacity.vo';
import { GeoPolygonVo } from '../../domain/value-objects/geo-polygon.vo';
import { SoilPhVo } from '../../domain/value-objects/soil-ph.vo';
import { SoilTextureTypeVo } from '../../domain/value-objects/soil-texture-type.vo';
import { SolarRadiationLevelVo } from '../../domain/value-objects/solar-radiation-level.vo';
import {
  TechnicalScoreBreakdown,
  WatermelonViabilityScoreVo,
} from '../../domain/value-objects/watermelon-viability-score.vo';

interface ParcelRow {
  id: string;
  farmer_id: string;
  parcel_name: string;
  watermelon_variety: string;
  planting_date: Date | string;
  boundary_geojson: string;
  centroid_lon: string | number;
  centroid_lat: string | number;
  area_hectares: string | number;
  perimeter_meters: string | number;
  created_at: Date | string;
  eval_id?: string | null;
  evaluated_at?: Date | string | null;
  soil_texture?: string | null;
  ph_level?: string | number | null;
  drainage_level?: string | null;
  altitude_msnm?: string | number | null;
  solar_radiation_mjm2?: string | number | null;
  slope_pct?: string | number | null;
  viability_score_pct?: string | number | null;
  suitability_category?: string | null;
  technical_breakdown?: TechnicalScoreBreakdown | null;
  limiting_factors?: string[] | null;
}

@Injectable()
export class PostgisParcelRepository implements ParcelPostgisRepositoryPort {
  constructor(private readonly pg: PostgresService) {}

  public async createParcelWithPostgisMetrics(
    params: CreateParcelSpatialPersistenceParams,
  ): Promise<ParcelAggregate> {
    const geoJsonString = JSON.stringify(params.boundaryGeoJson);

    // 1. Validar topología real en PostGIS con ST_IsValid y ST_IsValidReason
    const validityCheck = await this.pg.query<{ is_valid: boolean; reason: string }>(
      `
      WITH input_geom AS (
        SELECT ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) AS geom
      )
      SELECT
        ST_IsValid(geom) AS is_valid,
        ST_IsValidReason(geom) AS reason
      FROM input_geom;
      `,
      [geoJsonString],
    );

    const validationRow = validityCheck.rows[0];
    if (!validationRow || !validationRow.is_valid) {
      throw new InvalidParcelPolygonException(
        `El polígono trazado presenta auto-intersección o geometría inválida en PostGIS: ${
          validationRow?.reason ?? 'Desconocido'
        }`,
        { postgisReason: validationRow?.reason },
      );
    }

    // 2. Insertar polígono y calcular área geodésica real en hectáreas (ST_Area geography) y centroide
    const insertResult = await this.pg.query<ParcelRow>(
      `
      WITH input_geom AS (
        SELECT ST_SetSRID(ST_GeomFromGeoJSON($5), 4326) AS geom
      )
      INSERT INTO ms2_zoning.parcels (
        farmer_id,
        parcel_name,
        watermelon_variety,
        planting_date,
        boundary_geom,
        centroid_geom,
        area_hectares,
        perimeter_meters
      )
      SELECT
        $1::uuid,
        $2::varchar,
        $3::varchar,
        $4::date,
        geom,
        ST_Centroid(geom),
        ROUND((ST_Area(geom::geography) / 10000.0)::numeric, 4),
        ROUND((ST_Perimeter(geom::geography))::numeric, 2)
      FROM input_geom
      RETURNING
        id,
        farmer_id,
        parcel_name,
        watermelon_variety,
        TO_CHAR(planting_date, 'YYYY-MM-DD') AS planting_date,
        ST_AsGeoJSON(boundary_geom) AS boundary_geojson,
        ST_X(centroid_geom) AS centroid_lon,
        ST_Y(centroid_geom) AS centroid_lat,
        area_hectares,
        perimeter_meters,
        created_at;
      `,
      [
        params.farmerId,
        params.parcelName,
        params.watermelonVariety,
        params.plantingDate,
        geoJsonString,
      ],
    );

    return this.mapRowToAggregate(insertResult.rows[0]);
  }

  public async saveSoilEvaluation(
    report: SoilEvaluationReportEntity,
  ): Promise<SoilEvaluationReportEntity> {
    await this.pg.query(
      `
      INSERT INTO ms2_zoning.soil_suitability_evaluations (
        id,
        parcel_id,
        evaluated_at,
        soil_texture,
        ph_level,
        drainage_level,
        altitude_msnm,
        solar_radiation_mjm2,
        slope_pct,
        viability_score_pct,
        suitability_category,
        technical_breakdown,
        limiting_factors
      ) VALUES (
        $1::uuid,
        $2::uuid,
        $3::timestamptz,
        $4::varchar,
        $5::numeric,
        $6::varchar,
        $7::numeric,
        $8::numeric,
        $9::numeric,
        $10::numeric,
        $11::varchar,
        $12::jsonb,
        $13::text[]
      );
      `,
      [
        report.id,
        report.parcelId,
        report.evaluatedAt.toISOString(),
        report.soilTexture.value,
        report.soilPh.value,
        report.drainage.value,
        report.topography.altitudeMsnm,
        report.solarRadiation.value,
        report.topography.slopePct,
        report.viabilityScore.viabilityScorePct,
        report.viabilityScore.suitabilityCategory,
        JSON.stringify(report.viabilityScore.breakdown),
        report.viabilityScore.limitingFactors,
      ],
    );

    return report;
  }

  public async findParcelById(parcelId: string): Promise<ParcelAggregate | null> {
    const res = await this.pg.query<ParcelRow>(
      `
      ${this.baseSelectWithLatestEvalSql()}
      WHERE p.id = $1::uuid;
      `,
      [parcelId],
    );

    if (res.rowCount === 0) {
      return null;
    }
    return this.mapRowToAggregate(res.rows[0]);
  }

  public async findParcelsByFarmerId(farmerId: string): Promise<ParcelAggregate[]> {
    const res = await this.pg.query<ParcelRow>(
      `
      ${this.baseSelectWithLatestEvalSql()}
      WHERE p.farmer_id = $1::uuid
      ORDER BY p.created_at DESC;
      `,
      [farmerId],
    );

    return res.rows.map((r) => this.mapRowToAggregate(r));
  }

  public async findAllParcels(): Promise<ParcelAggregate[]> {
    const res = await this.pg.query<ParcelRow>(
      `
      ${this.baseSelectWithLatestEvalSql()}
      ORDER BY p.created_at DESC;
      `,
    );

    return res.rows.map((r) => this.mapRowToAggregate(r));
  }

  private baseSelectWithLatestEvalSql(): string {
    return `
      SELECT
        p.id,
        p.farmer_id,
        p.parcel_name,
        p.watermelon_variety,
        TO_CHAR(p.planting_date, 'YYYY-MM-DD') AS planting_date,
        ST_AsGeoJSON(p.boundary_geom) AS boundary_geojson,
        ST_X(p.centroid_geom) AS centroid_lon,
        ST_Y(p.centroid_geom) AS centroid_lat,
        p.area_hectares,
        p.perimeter_meters,
        p.created_at,
        e.id AS eval_id,
        e.evaluated_at,
        e.soil_texture,
        e.ph_level,
        e.drainage_level,
        e.altitude_msnm,
        e.solar_radiation_mjm2,
        e.slope_pct,
        e.viability_score_pct,
        e.suitability_category,
        e.technical_breakdown,
        e.limiting_factors
      FROM ms2_zoning.parcels p
      LEFT JOIN LATERAL (
        SELECT *
        FROM ms2_zoning.soil_suitability_evaluations se
        WHERE se.parcel_id = p.id
        ORDER BY se.evaluated_at DESC
        LIMIT 1
      ) e ON TRUE
    `;
  }

  private mapRowToAggregate(row: ParcelRow): ParcelAggregate {
    const parsedPolygon = JSON.parse(row.boundary_geojson) as GeoJsonPolygon;
    const boundaryPolygon = GeoPolygonVo.create(parsedPolygon);

    const parcel = ParcelAggregate.create(
      {
        farmerId: row.farmer_id,
        parcelName: row.parcel_name,
        watermelonVariety: row.watermelon_variety,
        plantingDate: String(row.planting_date),
        boundaryPolygon,
        centroid: {
          lon: Number(Number(row.centroid_lon).toFixed(6)),
          lat: Number(Number(row.centroid_lat).toFixed(6)),
        },
        areaHectares: Number(row.area_hectares),
        perimeterMeters: Number(row.perimeter_meters),
        createdAt: new Date(row.created_at),
      },
      row.id,
    );

    if (row.eval_id && row.soil_texture && row.ph_level !== null && row.ph_level !== undefined) {
      const breakdown: TechnicalScoreBreakdown = {
        textureScore: row.technical_breakdown?.textureScore ?? 25,
        phScore: row.technical_breakdown?.phScore ?? 25,
        drainageScore: row.technical_breakdown?.drainageScore ?? 20,
        radiationScore: row.technical_breakdown?.radiationScore ?? 15,
        topographyScore: row.technical_breakdown?.topographyScore ?? 10,
        recommendations: row.technical_breakdown?.recommendations ?? [
          'Terreno apto para el desarrollo vegetativo y reproductivo de la sandía.',
        ],
      };

      const viabilityScore = WatermelonViabilityScoreVo.create({
        breakdown,
        limitingFactors: row.limiting_factors ?? [],
      });

      const evaluation = SoilEvaluationReportEntity.create(
        {
          parcelId: row.id,
          soilTexture: SoilTextureTypeVo.create(row.soil_texture),
          soilPh: SoilPhVo.create(Number(row.ph_level)),
          drainage: DrainageCapacityVo.create(row.drainage_level ?? 'OPTIMO_BUENO'),
          solarRadiation: SolarRadiationLevelVo.create(Number(row.solar_radiation_mjm2 ?? 24.5)),
          topography: AltitudeAndSlopeVo.create(
            Number(row.altitude_msnm ?? 400),
            Number(row.slope_pct ?? 1.8),
          ),
          viabilityScore,
          evaluatedAt: row.evaluated_at ? new Date(row.evaluated_at) : new Date(),
        },
        row.eval_id,
      );

      parcel.attachSoilEvaluation(evaluation);
    }

    return parcel;
  }
}
