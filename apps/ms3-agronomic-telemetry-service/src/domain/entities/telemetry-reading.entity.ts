import { Entity } from '@agrosat/shared-kernel';
import { AmbientClimateVo } from '../value-objects/ambient-climate.vo';
import { DualDepthSoilMoistureVo } from '../value-objects/dual-depth-soil-moisture.vo';

export interface TelemetryReadingProps {
  parcelId: string;
  sensorNodeCode: string;
  recordedAt: Date;
  climate: AmbientClimateVo;
  soilMoisture: DualDepthSoilMoistureVo;
  isAnomalyFlagged: boolean;
}

export class TelemetryReadingEntity extends Entity<TelemetryReadingProps> {
  private constructor(props: TelemetryReadingProps, id?: string) {
    super(props, id);
  }

  public static create(
    params: {
      parcelId: string;
      sensorNodeCode?: string;
      recordedAt?: Date;
      climate: AmbientClimateVo;
      soilMoisture: DualDepthSoilMoistureVo;
    },
    id?: string,
  ): TelemetryReadingEntity {
    const temp = params.climate.ambientTempC;
    const moisture20 = params.soilMoisture.soilMoisture20cmPct;

    // Reglas críticas de dominio para cultivo de sandía:
    // 1) Helada (< 4.0°C)
    // 2) Golpe de calor (> 38.0°C) combinado con déficit hídrico a 20cm (< 25.0%)
    // 3) Sequía radicular extrema (< 20.0%)
    const isAnomalyFlagged =
      temp < 4.0 || (temp > 38.0 && moisture20 < 25.0) || moisture20 < 20.0;

    return new TelemetryReadingEntity(
      {
        parcelId: params.parcelId,
        sensorNodeCode: params.sensorNodeCode ?? 'NODERED-IOT-01',
        recordedAt: params.recordedAt ?? new Date(),
        climate: params.climate,
        soilMoisture: params.soilMoisture,
        isAnomalyFlagged,
      },
      id,
    );
  }

  get parcelId(): string {
    return this.props.parcelId;
  }

  get sensorNodeCode(): string {
    return this.props.sensorNodeCode;
  }

  get recordedAt(): Date {
    return this.props.recordedAt;
  }

  get climate(): AmbientClimateVo {
    return this.props.climate;
  }

  get soilMoisture(): DualDepthSoilMoistureVo {
    return this.props.soilMoisture;
  }

  get isAnomalyFlagged(): boolean {
    return this.props.isAnomalyFlagged;
  }
}
