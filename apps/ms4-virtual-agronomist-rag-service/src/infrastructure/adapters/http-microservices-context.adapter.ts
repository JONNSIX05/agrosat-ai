import { Injectable, Logger } from '@nestjs/common';
import {
  LatestSatelliteSceneContextDto,
  ParcelSuitabilityContextDto,
  TelemetrySummaryContextDto,
} from '@agrosat/service-contracts';
import { PostgresService } from '@agrosat/shared-kernel';
import { AssembledAgronomicContext } from '../../domain/entities/agronomic-consultation.aggregate';
import { MicroservicesContextPort } from '../../application/ports/out/microservices-context.port';

@Injectable()
export class HttpMicroservicesContextAdapter implements MicroservicesContextPort {
  private readonly logger = new Logger(HttpMicroservicesContextAdapter.name);

  private readonly ms1Url = process.env.MS1_INTERNAL_URL || 'http://agrosat_ms1_satellite:3001';
  private readonly ms2Url = process.env.MS2_INTERNAL_URL || 'http://agrosat_ms2_zoning:3002';
  private readonly ms3Url = process.env.MS3_INTERNAL_URL || 'http://agrosat_ms3_telemetry:3003';
  private readonly ms5Url = process.env.MS5_INTERNAL_URL || 'http://agrosat_ms5_alerts:3005';

  constructor(private readonly pg: PostgresService) {}

  public async assembleParcelContext(parcelId: string): Promise<AssembledAgronomicContext> {
    const [parcel, satellite, telemetry] = await Promise.all([
      this.fetchParcelContext(parcelId),
      this.fetchSatelliteContext(parcelId),
      this.fetchTelemetryContext(parcelId),
    ]);

    return {
      parcel,
      satellite,
      telemetry,
    };
  }

  public async resolveParcelIdByTelegramChatId(telegramChatId: string): Promise<string> {
    const defaultParcelId =
      process.env.DEFAULT_PARCEL_ID || '00000000-0000-0000-0000-000000000001';

    if (!telegramChatId) {
      return defaultParcelId;
    }

    try {
      const res = await fetch(
        `${this.ms5Url}/internal/v1/alerts/telegram/${encodeURIComponent(telegramChatId)}/parcel`,
        { signal: AbortSignal.timeout(3000) },
      );
      if (res.ok) {
        const data = (await res.json()) as { parcelId?: string };
        if (data?.parcelId) {
          return data.parcelId;
        }
      }
    } catch {
      // Fallback directo a PostgreSQL si MS5 no responde a tiempo
    }

    try {
      const dbRes = await this.pg.query<{ parcel_id: string }>(
        `
        SELECT fps.parcel_id
        FROM ms5_alerts.farmers f
        INNER JOIN ms5_alerts.farmer_parcel_subscriptions fps ON fps.farmer_id = f.id
        WHERE f.telegram_chat_id = $1::varchar
        ORDER BY f.created_at DESC
        LIMIT 1;
        `,
        [telegramChatId],
      );
      if (dbRes.rows[0]?.parcel_id) {
        return dbRes.rows[0].parcel_id;
      }
    } catch (err) {
      this.logger.warn(`Error resolviendo parcela por telegramChatId: ${(err as Error).message}`);
    }

    return defaultParcelId;
  }

  private async fetchParcelContext(
    parcelId: string,
  ): Promise<ParcelSuitabilityContextDto | null> {
    try {
      const res = await fetch(
        `${this.ms2Url}/internal/v1/parcels/${encodeURIComponent(parcelId)}/suitability`,
        { signal: AbortSignal.timeout(3500) },
      );
      if (res.ok) {
        return (await res.json()) as ParcelSuitabilityContextDto;
      }
    } catch (err) {
      this.logger.warn(`Fallback SQL para contexto MS2 (${(err as Error).message})`);
    }

    try {
      const dbRes = await this.pg.query<{
        id: string;
        farmer_id: string;
        parcel_name: string;
        watermelon_variety: string;
        planting_date: Date | string;
        area_hectares: string | number;
        centroid_lon: string | number;
        centroid_lat: string | number;
        boundary_geojson: string;
        soil_texture: string | null;
        ph_level: string | number | null;
        drainage_level: string | null;
        altitude_msnm: string | number | null;
        solar_radiation_mjm2: string | number | null;
        slope_pct: string | number | null;
        viability_score_pct: string | number | null;
        suitability_category: string | null;
        limiting_factors: string[] | null;
      }>(
        `
        SELECT
          p.id,
          p.farmer_id,
          p.parcel_name,
          p.watermelon_variety,
          p.planting_date,
          p.area_hectares,
          ST_X(p.centroid_geom) AS centroid_lon,
          ST_Y(p.centroid_geom) AS centroid_lat,
          ST_AsGeoJSON(p.boundary_geom) AS boundary_geojson,
          s.soil_texture,
          s.ph_level,
          s.drainage_level,
          s.altitude_msnm,
          s.solar_radiation_mjm2,
          s.slope_pct,
          s.viability_score_pct,
          s.suitability_category,
          s.limiting_factors
        FROM ms2_zoning.parcels p
        LEFT JOIN LATERAL (
          SELECT *
          FROM ms2_zoning.soil_suitability_evaluations se
          WHERE se.parcel_id = p.id
          ORDER BY se.evaluated_at DESC
          LIMIT 1
        ) s ON TRUE
        WHERE p.id = $1::uuid
        LIMIT 1;
        `,
        [parcelId],
      );

      if (dbRes.rowCount && dbRes.rows[0]) {
        const r = dbRes.rows[0];
        return {
          parcelId: r.id,
          farmerId: r.farmer_id,
          parcelName: r.parcel_name,
          watermelonVariety: r.watermelon_variety,
          plantingDate:
            r.planting_date instanceof Date
              ? r.planting_date.toISOString().slice(0, 10)
              : String(r.planting_date).slice(0, 10),
          areaHectares: Number(r.area_hectares),
          centroid: {
            lon: Number(Number(r.centroid_lon).toFixed(6)),
            lat: Number(Number(r.centroid_lat).toFixed(6)),
          },
          boundaryGeoJson: JSON.parse(r.boundary_geojson),
          soilEvaluation: {
            soilTexture: (r.soil_texture as any) || 'FRANCO_ARENOSA',
            phLevel: Number(r.ph_level ?? 6.4),
            drainageLevel: (r.drainage_level as any) || 'OPTIMO_BUENO',
            altitudeMsnm: Number(r.altitude_msnm ?? 420),
            solarRadiationMjm2: Number(r.solar_radiation_mjm2 ?? 24.8),
            slopePct: Number(r.slope_pct ?? 1.8),
            viabilityScorePct: Number(r.viability_score_pct ?? 94.0),
            suitabilityCategory: (r.suitability_category as any) || 'ALTAMENTE_APTO',
            limitingFactors: r.limiting_factors ?? [],
          },
        };
      }
    } catch (dbErr) {
      this.logger.warn(`Error en fallback SQL MS2: ${(dbErr as Error).message}`);
    }

    return null;
  }

  private async fetchSatelliteContext(
    parcelId: string,
  ): Promise<LatestSatelliteSceneContextDto | null> {
    try {
      const res = await fetch(
        `${this.ms1Url}/internal/v1/scenes/latest/${encodeURIComponent(parcelId)}`,
        { signal: AbortSignal.timeout(3500) },
      );
      if (res.ok) {
        return (await res.json()) as LatestSatelliteSceneContextDto;
      }
    } catch (err) {
      this.logger.warn(`Fallback SQL para contexto MS1 (${(err as Error).message})`);
    }

    try {
      const dbRes = await this.pg.query<{
        id: string;
        parcel_id: string;
        captured_at: Date | string;
        days_after_planting: number;
        phenological_stage: string;
        mean_ndvi: string | number;
        min_ndvi: string | number;
        max_ndvi: string | number;
        mean_evi: string | number;
        stressed_cells_pct: string | number;
        has_stress_patch: boolean;
        stress_patch_metadata: Record<string, any> | null;
      }>(
        `
        SELECT *
        FROM ms1_satellite.sentinel_scenes
        WHERE parcel_id = $1::uuid
        ORDER BY captured_at DESC, created_at DESC
        LIMIT 2;
        `,
        [parcelId],
      );

      if (dbRes.rowCount && dbRes.rows[0]) {
        const s = dbRes.rows[0];
        const prev = dbRes.rows[1];
        const ndviDelta = prev
          ? Number((Number(s.mean_ndvi) - Number(prev.mean_ndvi)).toFixed(4))
          : 0;

        return {
          sceneId: s.id,
          parcelId: s.parcel_id,
          capturedAt: new Date(s.captured_at).toISOString(),
          daysAfterPlanting: Number(s.days_after_planting),
          phenologicalStage: s.phenological_stage as any,
          meanNdvi: Number(s.mean_ndvi),
          minNdvi: Number(s.min_ndvi),
          maxNdvi: Number(s.max_ndvi),
          meanEvi: Number(s.mean_evi),
          ndviDelta,
          stressedCellsPct: Number(s.stressed_cells_pct),
          hasStressPatch: Boolean(s.has_stress_patch),
          stressPatchMetadata: s.stress_patch_metadata
            ? {
                centerLon: Number(s.stress_patch_metadata.centerLon),
                centerLat: Number(s.stress_patch_metadata.centerLat),
                radiusMeters: Number(s.stress_patch_metadata.radiusMeters),
                ndviDropMagnitude: Number(s.stress_patch_metadata.ndviDropMagnitude),
                anomalyCause: String(s.stress_patch_metadata.anomalyCause),
              }
            : undefined,
        };
      }
    } catch (dbErr) {
      this.logger.warn(`Error en fallback SQL MS1: ${(dbErr as Error).message}`);
    }

    return null;
  }

  private async fetchTelemetryContext(
    parcelId: string,
  ): Promise<TelemetrySummaryContextDto | null> {
    try {
      const res = await fetch(
        `${this.ms3Url}/internal/v1/telemetry/${encodeURIComponent(parcelId)}/summary`,
        { signal: AbortSignal.timeout(3500) },
      );
      if (res.ok) {
        return (await res.json()) as TelemetrySummaryContextDto;
      }
    } catch (err) {
      this.logger.warn(`Fallback para contexto MS3 (${(err as Error).message})`);
    }
    return null;
  }
}
