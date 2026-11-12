import { Injectable } from '@nestjs/common';
import { PostgresService } from '@agrosat/shared-kernel';
import { GeoJsonPolygon, GisGeometryUtil } from '@agrosat/gis-contracts';
import {
  SentinelSpatialSimulatorPort,
  SimulateSceneSpatialParams,
} from '../../application/ports/out/sentinel-spatial-simulator.port';
import { SentinelSceneAggregate } from '../../domain/entities/sentinel-scene.aggregate';
import { SpectralSubcellEntity } from '../../domain/entities/spectral-subcell.entity';
import { SpectralBandsVo } from '../../domain/value-objects/spectral-bands.vo';

interface GridCellQueryResult {
  row_idx: number;
  col_idx: number;
  cell_geojson: string;
  lon: number;
  lat: number;
}

@Injectable()
export class SimulatedSentinelPostgisAdapter implements SentinelSpatialSimulatorPort {
  constructor(private readonly pg: PostgresService) {}

  public async generateSimulatedScene(
    params: SimulateSceneSpatialParams,
  ): Promise<SentinelSceneAggregate> {
    const { parcelId, parcelPolygonGeoJson, phenology, stressPatch, simulationSeed } = params;
    const seed = simulationSeed ?? phenology.daysAfterPlanting * 13 + 7;

    // 1. Determinar tamaño de celda adaptativo (entre ~15m y ~40m) para generar entre 90 y 260 sub-polígonos
    const bbox = GisGeometryUtil.computeBoundingBox(parcelPolygonGeoJson);
    const maxSpanDeg = Math.max(bbox.maxLon - bbox.minLon, bbox.maxLat - bbox.minLat, 0.0008);
    const cellSizeDeg = Number(Math.max(0.00018, Math.min(0.0025, maxSpanDeg / 14)).toFixed(6));

    // 2. Subdividir el polígono en PostGIS usando ST_SquareGrid + ST_Intersection
    const gridResult = await this.pg.query<GridCellQueryResult>(
      `
      WITH parcel AS (
        SELECT ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) AS geom
      ),
      raw_grid AS (
        SELECT
          (g).i AS col_idx,
          (g).j AS row_idx,
          ST_CollectionExtract(ST_Intersection((g).geom, parcel.geom), 3) AS clipped_geom
        FROM parcel,
             ST_SquareGrid($2::float8, parcel.geom) AS g
        WHERE ST_Intersects((g).geom, parcel.geom)
      )
      SELECT
        row_idx::int AS row_idx,
        col_idx::int AS col_idx,
        ST_AsGeoJSON(ST_GeometryN(ST_Multi(clipped_geom), 1)) AS cell_geojson,
        ST_X(ST_Centroid(clipped_geom))::float8 AS lon,
        ST_Y(ST_Centroid(clipped_geom))::float8 AS lat
      FROM raw_grid
      WHERE NOT ST_IsEmpty(clipped_geom)
        AND ST_Area(clipped_geom::geography) > 8.0
      ORDER BY row_idx ASC, col_idx ASC;
      `,
      [JSON.stringify(parcelPolygonGeoJson), cellSizeDeg],
    );

    const subcells: SpectralSubcellEntity[] = [];

    for (const row of gridResult.rows) {
      const cellGeoJson = JSON.parse(row.cell_geojson) as GeoJsonPolygon;
      const lon = Number(row.lon);
      const lat = Number(row.lat);

      // 3. Ruido espacial 2D suave de 2 octavas (tipo Perlin/Simplex continuo) en [-0.055, +0.055]
      const smoothNoise = this.computeSmooth2DNoise(lon, lat, seed);

      // 4. NDVI saludable esperado según etapa fenológica + variación espacial suave
      const healthyCellNdvi = phenology.expectedBaseNdvi + smoothNoise;

      // 5. Si hay mancha de estrés hídrico o plaga, calcular caída gaussiana radial en esta sub-celda
      const stressDrop = stressPatch
        ? stressPatch.computeCellNdviDrop(lon, lat, healthyCellNdvi)
        : 0;

      const targetCellNdvi = Math.max(-0.08, Math.min(0.85, healthyCellNdvi - stressDrop));

      // Reflectancia NIR base modulada ligeramente por el vigor de la celda
      const baseNir = 0.36 + Math.max(0, targetCellNdvi) * 0.22;
      const spectralBands = SpectralBandsVo.fromTargetNdvi(targetCellNdvi, baseNir);

      subcells.push(
        SpectralSubcellEntity.create({
          parcelId,
          cellRow: Number(row.row_idx),
          cellCol: Number(row.col_idx),
          cellGeoJson,
          centroid: {
            lon: Number(lon.toFixed(6)),
            lat: Number(lat.toFixed(6)),
          },
          spectralBands,
        }),
      );
    }

    return SentinelSceneAggregate.createFromSubcells({
      parcelId,
      daysAfterPlanting: phenology.daysAfterPlanting,
      phenologicalStage: phenology.stage,
      hasStressPatch: Boolean(stressPatch),
      stressPatchMetadata: stressPatch ? stressPatch.toPrimitives() : null,
      subcells,
    });
  }

  /**
   * Generador matemático de ruido espacial 2D continuo de dos octavas para simular
   * gradientes naturales de vigor vegetativo dentro de la parcela.
   */
  private computeSmooth2DNoise(lon: number, lat: number, seed: number): number {
    const scale1 = 4200.0;
    const scale2 = 9100.0;

    const octave1 =
      Math.sin(lon * scale1 + seed * 0.7) * Math.cos(lat * scale1 - seed * 0.3);
    const octave2 =
      0.5 * Math.sin((lon + lat) * scale2 + seed * 1.3) * Math.cos((lon - lat) * scale2);

    const combined = (octave1 + octave2) / 1.5; // En [-1, 1]
    return Number((combined * 0.055).toFixed(4));
  }
}
