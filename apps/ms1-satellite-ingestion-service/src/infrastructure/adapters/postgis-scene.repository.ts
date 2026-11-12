import { Injectable } from '@nestjs/common';
import { PostgresService } from '@agrosat/shared-kernel';
import { GeoJsonPolygon } from '@agrosat/gis-contracts';
import { WatermelonPhenologicalStageCode } from '@agrosat/service-contracts';
import { SentinelSceneSummaryDto } from '../../application/dtos/sentinel-scene-response.dto';
import { SentinelSceneRepositoryPort } from '../../application/ports/out/sentinel-scene-repository.port';
import { SentinelSceneAggregate } from '../../domain/entities/sentinel-scene.aggregate';
import { SpectralSubcellEntity } from '../../domain/entities/spectral-subcell.entity';
import { SpectralBandsVo } from '../../domain/value-objects/spectral-bands.vo';
import { StressPatchAnomalyProps } from '../../domain/value-objects/stress-patch-anomaly.vo';

interface SceneRow {
  id: string;
  parcel_id: string;
  scene_code: string;
  captured_at: Date | string;
  days_after_planting: number;
  phenological_stage: WatermelonPhenologicalStageCode;
  cloud_cover_pct: string | number;
  mean_ndvi: string | number;
  min_ndvi: string | number;
  max_ndvi: string | number;
  stddev_ndvi: string | number;
  mean_evi: string | number;
  stressed_cells_pct: string | number;
  has_stress_patch: boolean;
  stress_patch_metadata: StressPatchAnomalyProps | null;
  total_subcells?: string | number;
}

interface SubcellRow {
  id: string;
  scene_id: string;
  parcel_id: string;
  cell_row: number;
  cell_col: number;
  cell_geojson: string;
  centroid_lon: string | number;
  centroid_lat: string | number;
  band_b02_blue: string | number;
  band_b04_red: string | number;
  band_b08_nir: string | number;
  ndvi: string | number;
  evi: string | number;
}

@Injectable()
export class PostgisSceneRepository implements SentinelSceneRepositoryPort {
  constructor(private readonly pg: PostgresService) {}

  public async saveSceneWithSubcells(
    scene: SentinelSceneAggregate,
  ): Promise<SentinelSceneAggregate> {
    await this.pg.withTransaction(async (client) => {
      await client.query(
        `
        INSERT INTO ms1_satellite.sentinel_scenes (
          id,
          parcel_id,
          scene_code,
          captured_at,
          days_after_planting,
          phenological_stage,
          cloud_cover_pct,
          mean_ndvi,
          min_ndvi,
          max_ndvi,
          stddev_ndvi,
          mean_evi,
          stressed_cells_pct,
          has_stress_patch,
          stress_patch_metadata
        ) VALUES (
          $1::uuid,
          $2::uuid,
          $3::varchar,
          $4::timestamptz,
          $5::int,
          $6::varchar,
          $7::numeric,
          $8::numeric,
          $9::numeric,
          $10::numeric,
          $11::numeric,
          $12::numeric,
          $13::numeric,
          $14::boolean,
          $15::jsonb
        );
        `,
        [
          scene.id,
          scene.parcelId,
          scene.sceneCode,
          scene.capturedAt.toISOString(),
          scene.daysAfterPlanting,
          scene.phenologicalStage,
          scene.cloudCoverPct,
          scene.meanNdvi,
          scene.minNdvi,
          scene.maxNdvi,
          scene.stddevNdvi,
          scene.meanEvi,
          scene.stressedCellsPct,
          scene.hasStressPatch,
          scene.stressPatchMetadata ? JSON.stringify(scene.stressPatchMetadata) : null,
        ],
      );

      for (const cell of scene.subcells) {
        await client.query(
          `
          INSERT INTO ms1_satellite.spectral_subcells (
            id,
            scene_id,
            parcel_id,
            cell_row,
            cell_col,
            cell_geom,
            centroid_geom,
            band_b02_blue,
            band_b04_red,
            band_b08_nir,
            ndvi,
            evi,
            vigor_level,
            is_stressed_cell
          ) VALUES (
            $1::uuid,
            $2::uuid,
            $3::uuid,
            $4::int,
            $5::int,
            ST_SetSRID(ST_GeomFromGeoJSON($6), 4326),
            ST_SetSRID(ST_MakePoint($7::float8, $8::float8), 4326),
            $9::numeric,
            $10::numeric,
            $11::numeric,
            $12::numeric,
            $13::numeric,
            $14::varchar,
            $15::boolean
          );
          `,
          [
            cell.id,
            scene.id,
            cell.parcelId,
            cell.cellRow,
            cell.cellCol,
            JSON.stringify(cell.cellGeoJson),
            cell.centroid.lon,
            cell.centroid.lat,
            cell.spectralBands.b02Blue,
            cell.spectralBands.b04Red,
            cell.spectralBands.b08Nir,
            cell.ndvi,
            cell.evi,
            cell.vigorLevel,
            cell.isStressedCell,
          ],
        );
      }
    });

    return scene;
  }

  public async findLatestSceneWithSubcellsByParcelId(
    parcelId: string,
  ): Promise<SentinelSceneAggregate | null> {
    const sceneRes = await this.pg.query<SceneRow>(
      `
      SELECT *
      FROM ms1_satellite.sentinel_scenes
      WHERE parcel_id = $1::uuid
      ORDER BY captured_at DESC, created_at DESC
      LIMIT 1;
      `,
      [parcelId],
    );

    if (sceneRes.rowCount === 0) {
      return null;
    }

    return this.hydrateSceneWithSubcells(sceneRes.rows[0]);
  }

  public async findSceneWithSubcellsById(
    sceneId: string,
  ): Promise<SentinelSceneAggregate | null> {
    const sceneRes = await this.pg.query<SceneRow>(
      `
      SELECT *
      FROM ms1_satellite.sentinel_scenes
      WHERE id = $1::uuid
      LIMIT 1;
      `,
      [sceneId],
    );

    if (sceneRes.rowCount === 0) {
      return null;
    }

    return this.hydrateSceneWithSubcells(sceneRes.rows[0]);
  }

  private async hydrateSceneWithSubcells(row: SceneRow): Promise<SentinelSceneAggregate> {
    const cellsRes = await this.pg.query<SubcellRow>(
      `
      SELECT
        id,
        scene_id,
        parcel_id,
        cell_row,
        cell_col,
        ST_AsGeoJSON(cell_geom) AS cell_geojson,
        ST_X(centroid_geom) AS centroid_lon,
        ST_Y(centroid_geom) AS centroid_lat,
        band_b02_blue,
        band_b04_red,
        band_b08_nir,
        ndvi,
        evi
      FROM ms1_satellite.spectral_subcells
      WHERE scene_id = $1::uuid
      ORDER BY cell_row ASC, cell_col ASC;
      `,
      [row.id],
    );

    const subcells = cellsRes.rows.map((c) =>
      SpectralSubcellEntity.create(
        {
          parcelId: c.parcel_id,
          cellRow: Number(c.cell_row),
          cellCol: Number(c.cell_col),
          cellGeoJson: JSON.parse(c.cell_geojson) as GeoJsonPolygon,
          centroid: {
            lon: Number(Number(c.centroid_lon).toFixed(6)),
            lat: Number(Number(c.centroid_lat).toFixed(6)),
          },
          spectralBands: SpectralBandsVo.fromPersisted({
            b02Blue: Number(c.band_b02_blue),
            b04Red: Number(c.band_b04_red),
            b08Nir: Number(c.band_b08_nir),
            ndvi: Number(c.ndvi),
            evi: Number(c.evi),
          }),
        },
        c.id,
      ),
    );

    return SentinelSceneAggregate.createHydrated(
      {
        parcelId: row.parcel_id,
        sceneCode: row.scene_code,
        capturedAt: new Date(row.captured_at),
        daysAfterPlanting: Number(row.days_after_planting),
        phenologicalStage: row.phenological_stage,
        cloudCoverPct: Number(row.cloud_cover_pct),
        meanNdvi: Number(row.mean_ndvi),
        minNdvi: Number(row.min_ndvi),
        maxNdvi: Number(row.max_ndvi),
        stddevNdvi: Number(row.stddev_ndvi),
        meanEvi: Number(row.mean_evi),
        stressedCellsPct: Number(row.stressed_cells_pct),
        hasStressPatch: Boolean(row.has_stress_patch),
        stressPatchMetadata: row.stress_patch_metadata ?? null,
        subcells,
      },
      row.id,
    );
  }

  public async findPreviousSceneSummary(
    parcelId: string,
  ): Promise<SentinelSceneSummaryDto | null> {
    const res = await this.pg.query<SceneRow>(
      `
      SELECT
        s.*,
        (SELECT COUNT(*) FROM ms1_satellite.spectral_subcells sc WHERE sc.scene_id = s.id) AS total_subcells
      FROM ms1_satellite.sentinel_scenes s
      WHERE s.parcel_id = $1::uuid
      ORDER BY s.captured_at DESC, s.created_at DESC
      LIMIT 1;
      `,
      [parcelId],
    );

    if (res.rowCount === 0) {
      return null;
    }
    return this.mapRowToSummary(res.rows[0]);
  }

  public async findSceneTimeSeriesByParcelId(
    parcelId: string,
    limit = 30,
  ): Promise<SentinelSceneSummaryDto[]> {
    const res = await this.pg.query<SceneRow>(
      `
      SELECT *
      FROM (
        SELECT
          s.*,
          (SELECT COUNT(*) FROM ms1_satellite.spectral_subcells sc WHERE sc.scene_id = s.id) AS total_subcells
        FROM ms1_satellite.sentinel_scenes s
        WHERE s.parcel_id = $1::uuid
        ORDER BY s.days_after_planting DESC, s.captured_at DESC
        LIMIT $2::int
      ) sub
      ORDER BY sub.days_after_planting ASC, sub.captured_at ASC;
      `,
      [parcelId, limit],
    );

    return res.rows.map((r) => this.mapRowToSummary(r));
  }

  private mapRowToSummary(row: SceneRow): SentinelSceneSummaryDto {
    return {
      sceneId: row.id,
      parcelId: row.parcel_id,
      sceneCode: row.scene_code,
      capturedAt: new Date(row.captured_at).toISOString(),
      daysAfterPlanting: Number(row.days_after_planting),
      phenologicalStage: row.phenological_stage,
      cloudCoverPct: Number(row.cloud_cover_pct),
      meanNdvi: Number(row.mean_ndvi),
      minNdvi: Number(row.min_ndvi),
      maxNdvi: Number(row.max_ndvi),
      stddevNdvi: Number(row.stddev_ndvi),
      meanEvi: Number(row.mean_evi),
      stressedCellsPct: Number(row.stressed_cells_pct),
      totalSubcells: Number(row.total_subcells ?? 0),
      hasStressPatch: Boolean(row.has_stress_patch),
      stressPatchMetadata: row.stress_patch_metadata ?? null,
    };
  }
}
