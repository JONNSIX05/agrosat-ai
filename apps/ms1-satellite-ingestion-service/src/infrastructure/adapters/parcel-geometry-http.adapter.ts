import { Injectable, Logger } from '@nestjs/common';
import { PostgresService } from '@agrosat/shared-kernel';
import { GeoJsonPolygon } from '@agrosat/gis-contracts';
import {
  ParcelGeometryMetadata,
  ParcelGeometryProviderPort,
} from '../../application/ports/out/parcel-geometry-provider.port';

@Injectable()
export class ParcelGeometryHttpAdapter implements ParcelGeometryProviderPort {
  private readonly logger = new Logger(ParcelGeometryHttpAdapter.name);
  private readonly ms2BaseUrl = process.env.MS2_INTERNAL_URL ?? 'http://localhost:3002';

  constructor(private readonly pg: PostgresService) {}

  public async getParcelGeometry(parcelId: string): Promise<ParcelGeometryMetadata | null> {
    // 1. Intentar vía contrato HTTP interno hacia MS2
    try {
      const response = await fetch(`${this.ms2BaseUrl}/internal/v1/parcels/${parcelId}/geometry`, {
        signal: AbortSignal.timeout(3500),
      });
      if (response.ok) {
        return (await response.json()) as ParcelGeometryMetadata;
      }
    } catch (err) {
      this.logger.debug(
        `Fallback a consulta espacial directa en PostGIS para parcela ${parcelId}: ${
          err instanceof Error ? err.message : 'timeout'
        }`,
      );
    }

    // 2. Fallback resiliente sobre el esquema ms2_zoning en PostGIS
    const res = await this.pg.query<{
      id: string;
      parcel_name: string;
      planting_date: string;
      area_hectares: string | number;
      centroid_lon: string | number;
      centroid_lat: string | number;
      boundary_geojson: string;
    }>(
      `
      SELECT
        id,
        parcel_name,
        TO_CHAR(planting_date, 'YYYY-MM-DD') AS planting_date,
        area_hectares,
        ST_X(centroid_geom) AS centroid_lon,
        ST_Y(centroid_geom) AS centroid_lat,
        ST_AsGeoJSON(boundary_geom) AS boundary_geojson
      FROM ms2_zoning.parcels
      WHERE id = $1::uuid;
      `,
      [parcelId],
    );

    if (res.rowCount === 0) {
      return null;
    }

    const row = res.rows[0];
    return {
      parcelId: row.id,
      parcelName: row.parcel_name,
      plantingDate: row.planting_date,
      areaHectares: Number(row.area_hectares),
      centroid: {
        lon: Number(Number(row.centroid_lon).toFixed(6)),
        lat: Number(Number(row.centroid_lat).toFixed(6)),
      },
      boundaryGeoJson: JSON.parse(row.boundary_geojson) as GeoJsonPolygon,
    };
  }
}
