import { Injectable } from '@nestjs/common';
import { PostgresService } from '@agrosat/shared-kernel';
import { TelemetrySummaryContextDto } from '@agrosat/service-contracts';
import { TelemetryReadingResponseDto } from '../../application/dtos/ingest-telemetry.dto';
import { TelemetryRepositoryPort } from '../../application/ports/out/telemetry-repository.port';
import { TelemetryReadingEntity } from '../../domain/entities/telemetry-reading.entity';

interface ReadingRow {
  id: string;
  parcel_id: string;
  sensor_node_code: string;
  recorded_at: Date | string;
  ambient_temp_c: string | number;
  relative_humidity_pct: string | number;
  soil_moisture_20cm_pct: string | number;
  soil_moisture_40cm_pct: string | number;
  solar_radiation_wm2: string | number;
  vpd_kpa: string | number;
  is_anomaly_flagged: boolean;
}

@Injectable()
export class PostgresTelemetryRepository implements TelemetryRepositoryPort {
  constructor(private readonly pg: PostgresService) {}

  public async saveReading(reading: TelemetryReadingEntity): Promise<TelemetryReadingEntity> {
    await this.pg.query(
      `
      INSERT INTO ms3_telemetry.sensor_readings (
        id,
        parcel_id,
        sensor_node_code,
        recorded_at,
        ambient_temp_c,
        relative_humidity_pct,
        soil_moisture_20cm_pct,
        soil_moisture_40cm_pct,
        solar_radiation_wm2,
        vpd_kpa,
        is_anomaly_flagged
      ) VALUES (
        $1::uuid,
        $2::uuid,
        $3::varchar,
        $4::timestamptz,
        $5::numeric,
        $6::numeric,
        $7::numeric,
        $8::numeric,
        $9::numeric,
        $10::numeric,
        $11::boolean
      );
      `,
      [
        reading.id,
        reading.parcelId,
        reading.sensorNodeCode,
        reading.recordedAt.toISOString(),
        reading.climate.ambientTempC,
        reading.climate.relativeHumidityPct,
        reading.soilMoisture.soilMoisture20cmPct,
        reading.soilMoisture.soilMoisture40cmPct,
        reading.climate.solarRadiationWm2,
        reading.climate.vpdKpa,
        reading.isAnomalyFlagged,
      ],
    );

    return reading;
  }

  public async countReadingsForParcel(parcelId: string): Promise<number> {
    const res = await this.pg.query<{ total: string | number }>(
      `SELECT COUNT(*) AS total FROM ms3_telemetry.sensor_readings WHERE parcel_id = $1::uuid;`,
      [parcelId],
    );
    return Number(res.rows[0]?.total ?? 0);
  }

  public async getClimaticSummaryAndHistory(
    parcelId: string,
    limitReadings = 48,
  ): Promise<{
    summary: TelemetrySummaryContextDto;
    readings: TelemetryReadingResponseDto[];
  }> {
    const [aggRes, readingsRes] = await Promise.all([
      this.pg.query<{
        temp_avg_24h: string | number | null;
        temp_min_24h: string | number | null;
        temp_max_24h: string | number | null;
        moisture_20cm_avg_24h: string | number | null;
        moisture_40cm_avg_24h: string | number | null;
        radiation_avg_24h: string | number | null;
        temp_avg_7d: string | number | null;
        temp_min_7d: string | number | null;
        temp_max_7d: string | number | null;
        moisture_20cm_avg_7d: string | number | null;
        moisture_40cm_avg_7d: string | number | null;
        vpd_avg_7d: string | number | null;
        frost_events_24h: string | number | null;
        heat_shock_events_24h: string | number | null;
      }>(
        `
        SELECT
          ROUND(AVG(ambient_temp_c) FILTER (WHERE recorded_at >= NOW() - INTERVAL '24 hours'), 2) AS temp_avg_24h,
          MIN(ambient_temp_c) FILTER (WHERE recorded_at >= NOW() - INTERVAL '24 hours') AS temp_min_24h,
          MAX(ambient_temp_c) FILTER (WHERE recorded_at >= NOW() - INTERVAL '24 hours') AS temp_max_24h,
          ROUND(AVG(soil_moisture_20cm_pct) FILTER (WHERE recorded_at >= NOW() - INTERVAL '24 hours'), 2) AS moisture_20cm_avg_24h,
          ROUND(AVG(soil_moisture_40cm_pct) FILTER (WHERE recorded_at >= NOW() - INTERVAL '24 hours'), 2) AS moisture_40cm_avg_24h,
          ROUND(AVG(solar_radiation_wm2) FILTER (WHERE recorded_at >= NOW() - INTERVAL '24 hours'), 1) AS radiation_avg_24h,
          ROUND(AVG(ambient_temp_c) FILTER (WHERE recorded_at >= NOW() - INTERVAL '7 days'), 2) AS temp_avg_7d,
          MIN(ambient_temp_c) FILTER (WHERE recorded_at >= NOW() - INTERVAL '7 days') AS temp_min_7d,
          MAX(ambient_temp_c) FILTER (WHERE recorded_at >= NOW() - INTERVAL '7 days') AS temp_max_7d,
          ROUND(AVG(soil_moisture_20cm_pct) FILTER (WHERE recorded_at >= NOW() - INTERVAL '7 days'), 2) AS moisture_20cm_avg_7d,
          ROUND(AVG(soil_moisture_40cm_pct) FILTER (WHERE recorded_at >= NOW() - INTERVAL '7 days'), 2) AS moisture_40cm_avg_7d,
          ROUND(AVG(vpd_kpa) FILTER (WHERE recorded_at >= NOW() - INTERVAL '7 days'), 3) AS vpd_avg_7d,
          COUNT(*) FILTER (WHERE recorded_at >= NOW() - INTERVAL '24 hours' AND ambient_temp_c < 4.0) AS frost_events_24h,
          COUNT(*) FILTER (WHERE recorded_at >= NOW() - INTERVAL '24 hours' AND ambient_temp_c > 38.0 AND soil_moisture_20cm_pct < 25.0) AS heat_shock_events_24h
        FROM ms3_telemetry.sensor_readings
        WHERE parcel_id = $1::uuid
          AND recorded_at >= NOW() - INTERVAL '7 days';
        `,
        [parcelId],
      ),
      this.pg.query<ReadingRow>(
        `
        SELECT *
        FROM ms3_telemetry.sensor_readings
        WHERE parcel_id = $1::uuid
        ORDER BY recorded_at DESC
        LIMIT $2::int;
        `,
        [parcelId, limitReadings],
      ),
    ]);

    const readings: TelemetryReadingResponseDto[] = readingsRes.rows.map((r) => ({
      readingId: r.id,
      parcelId: r.parcel_id,
      sensorNodeCode: r.sensor_node_code,
      recordedAt: new Date(r.recorded_at).toISOString(),
      ambientTempC: Number(r.ambient_temp_c),
      relativeHumidityPct: Number(r.relative_humidity_pct),
      soilMoisture20cmPct: Number(r.soil_moisture_20cm_pct),
      soilMoisture40cmPct: Number(r.soil_moisture_40cm_pct),
      solarRadiationWm2: Number(r.solar_radiation_wm2),
      vpdKpa: Number(r.vpd_kpa),
      isAnomalyFlagged: Boolean(r.is_anomaly_flagged),
    }));

    const latest = readings[0] ?? {
      recordedAt: new Date().toISOString(),
      ambientTempC: 27.5,
      relativeHumidityPct: 54.0,
      soilMoisture20cmPct: 29.8,
      soilMoisture40cmPct: 33.0,
      solarRadiationWm2: 720.0,
      vpdKpa: 1.68,
    };

    const agg = aggRes.rows[0];
    const summary: TelemetrySummaryContextDto = {
      parcelId,
      current: {
        recordedAt: latest.recordedAt,
        ambientTempC: latest.ambientTempC,
        relativeHumidityPct: latest.relativeHumidityPct,
        soilMoisture20cmPct: latest.soilMoisture20cmPct,
        soilMoisture40cmPct: latest.soilMoisture40cmPct,
        solarRadiationWm2: latest.solarRadiationWm2,
        vpdKpa: latest.vpdKpa,
      },
      stats24h: {
        tempAvg: Number(agg?.temp_avg_24h ?? latest.ambientTempC),
        tempMin: Number(agg?.temp_min_24h ?? latest.ambientTempC),
        tempMax: Number(agg?.temp_max_24h ?? latest.ambientTempC),
        moisture20cmAvg: Number(agg?.moisture_20cm_avg_24h ?? latest.soilMoisture20cmPct),
        moisture40cmAvg: Number(agg?.moisture_40cm_avg_24h ?? latest.soilMoisture40cmPct),
        radiationAvg: Number(agg?.radiation_avg_24h ?? latest.solarRadiationWm2),
        frostEventsCount: Number(agg?.frost_events_24h ?? 0),
        heatShockEventsCount: Number(agg?.heat_shock_events_24h ?? 0),
      },
      stats7d: {
        tempAvg: Number(agg?.temp_avg_7d ?? latest.ambientTempC),
        tempMin: Number(agg?.temp_min_7d ?? latest.ambientTempC),
        tempMax: Number(agg?.temp_max_7d ?? latest.ambientTempC),
        moisture20cmAvg: Number(agg?.moisture_20cm_avg_7d ?? latest.soilMoisture20cmPct),
        moisture40cmAvg: Number(agg?.moisture_40cm_avg_7d ?? latest.soilMoisture40cmPct),
        vpdAvg: Number(agg?.vpd_avg_7d ?? latest.vpdKpa),
      },
    };

    return {
      summary,
      readings: readings.reverse(), // Orden cronológico ascendente para gráficas
    };
  }
}
