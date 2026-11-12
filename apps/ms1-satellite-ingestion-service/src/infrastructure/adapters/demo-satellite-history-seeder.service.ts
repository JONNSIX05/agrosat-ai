import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PostgresService } from '@agrosat/shared-kernel';
import { GetParcelNdviTimeseriesUseCase } from '../../application/use-cases/get-parcel-ndvi-timeseries.use-case';
import { SimulateSentinelPassUseCase } from '../../application/use-cases/simulate-sentinel-pass.use-case';

@Injectable()
export class DemoSatelliteHistorySeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoSatelliteHistorySeederService.name);
  private readonly demoParcelId =
    process.env.DEFAULT_PARCEL_ID ?? '00000000-0000-0000-0000-000000000001';

  constructor(
    private readonly pg: PostgresService,
    private readonly timeseriesUseCase: GetParcelNdviTimeseriesUseCase,
    private readonly simulatePassUseCase: SimulateSentinelPassUseCase,
  ) {}

  public async onApplicationBootstrap(): Promise<void> {
    try {
      await this.migrateParcelsToChiapasIfNeeded();

      const existing = await this.timeseriesUseCase.execute(this.demoParcelId, 5);
      if (existing.totalPasses > 0) {
        this.logger.log(
          `✅ Parcela demo Chiapas (${this.demoParcelId}) ya cuenta con ${existing.totalPasses} escenas satelitales en PostGIS.`,
        );
        return;
      }

      this.logger.log(
        `🛰️ Generando evolución fenológica inicial (DAS 12, 26, 38, 48) en PostGIS para parcela en Chiapas ${this.demoParcelId}...`,
      );
      for (const das of [12, 26, 38, 48]) {
        await this.simulatePassUseCase.execute(this.demoParcelId, {
          daysAfterPlanting: das,
          simulationSeed: das * 17,
        });
      }
      this.logger.log(
        `✅ Escenas Sentinel-2 simuladas y grillas PostGIS creadas en Chiapas para la parcela principal.`,
      );
    } catch (error) {
      this.logger.warn(
        `No se pudo ejecutar el auto-seeding inicial de MS1: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async migrateParcelsToChiapasIfNeeded(): Promise<void> {
    const nonChiapasRes = await this.pg.query<{ id: string; parcel_name: string; lat: number }>(
      `
      SELECT id, parcel_name, ST_Y(centroid_geom) AS lat
      FROM ms2_zoning.parcels
      WHERE ST_Y(centroid_geom) > 20.0
      ORDER BY created_at ASC;
      `,
    );

    if (!nonChiapasRes.rowCount || nonChiapasRes.rowCount === 0) {
      return;
    }

    this.logger.log(
      `🌎 Reubicando ${nonChiapasRes.rowCount} parcela(s) hacia el Estado de Chiapas, México (La Frailesca / Villaflores y Valle de Cintalapa)...`,
    );

    const villafloresPoly = JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [-93.2362, 16.2240],
          [-93.2338, 16.2240],
          [-93.2338, 16.2260],
          [-93.2362, 16.2260],
          [-93.2362, 16.2240],
        ],
      ],
    });

    const cintalapaPoly = JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [-93.7365, 16.6608],
          [-93.7335, 16.6608],
          [-93.7335, 16.6632],
          [-93.7365, 16.6632],
          [-93.7365, 16.6608],
        ],
      ],
    });

    for (const row of nonChiapasRes.rows) {
      const isPrimary = row.id === this.demoParcelId;
      const targetGeoJson = isPrimary ? villafloresPoly : cintalapaPoly;
      const targetName = isPrimary
        ? 'Parcela Sandía La Frailesca (Villaflores, Chiapas)'
        : 'Parcela Sandía Valle de Cintalapa (Chiapas)';
      const targetAltitude = isPrimary ? 540.0 : 525.0;

      await this.pg.query(
        `
        WITH new_geom AS (
          SELECT ST_SetSRID(ST_GeomFromGeoJSON($2), 4326) AS geom
        )
        UPDATE ms2_zoning.parcels p
        SET
          parcel_name = $3::varchar,
          boundary_geom = new_geom.geom,
          centroid_geom = ST_Centroid(new_geom.geom),
          area_hectares = ROUND((ST_Area(new_geom.geom::geography) / 10000.0)::numeric, 4),
          perimeter_meters = ROUND((ST_Perimeter(new_geom.geom::geography))::numeric, 2)
        FROM new_geom
        WHERE p.id = $1::uuid;
        `,
        [row.id, targetGeoJson, targetName],
      );

      await this.pg.query(
        `
        UPDATE ms2_zoning.soil_suitability_evaluations
        SET altitude_msnm = $2::numeric
        WHERE parcel_id = $1::uuid;
        `,
        [row.id, targetAltitude],
      );

      await this.pg.query(
        `
        UPDATE ms5_alerts.farmer_parcel_subscriptions
        SET parcel_alias = $2::varchar
        WHERE parcel_id = $1::uuid;
        `,
        [row.id, targetName],
      );

      await this.pg.query(
        `
        DELETE FROM ms1_satellite.spectral_subcells WHERE parcel_id = $1::uuid;
        `,
        [row.id],
      );
      await this.pg.query(
        `
        DELETE FROM ms1_satellite.sentinel_scenes WHERE parcel_id = $1::uuid;
        `,
        [row.id],
      );

      if (!isPrimary) {
        for (const das of [18, 34, 46]) {
          await this.simulatePassUseCase.execute(row.id, {
            daysAfterPlanting: das,
            simulationSeed: das * 23,
          });
        }
      }
    }
  }
}
