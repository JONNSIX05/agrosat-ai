import { ValueObject } from '@agrosat/shared-kernel';
import { InvalidTelemetryReadingException } from '../exceptions/telemetry-domain.exceptions';

interface DualDepthSoilMoistureProps {
  soilMoisture20cmPct: number; // Zona radicular absorbente activa en sandía
  soilMoisture40cmPct: number; // Zona de reserva y control de percolación
}

export class DualDepthSoilMoistureVo extends ValueObject<DualDepthSoilMoistureProps> {
  private constructor(props: DualDepthSoilMoistureProps) {
    super(props);
  }

  public static create(params: {
    soilMoisture20cmPct: number;
    soilMoisture40cmPct: number;
  }): DualDepthSoilMoistureVo {
    const { soilMoisture20cmPct, soilMoisture40cmPct } = params;

    if (
      !Number.isFinite(soilMoisture20cmPct) ||
      soilMoisture20cmPct < 0 ||
      soilMoisture20cmPct > 100
    ) {
      throw new InvalidTelemetryReadingException(
        `Humedad de suelo a 20cm inválida [0%, 100%]: ${soilMoisture20cmPct}`,
      );
    }
    if (
      !Number.isFinite(soilMoisture40cmPct) ||
      soilMoisture40cmPct < 0 ||
      soilMoisture40cmPct > 100
    ) {
      throw new InvalidTelemetryReadingException(
        `Humedad de suelo a 40cm inválida [0%, 100%]: ${soilMoisture40cmPct}`,
      );
    }

    return new DualDepthSoilMoistureVo({
      soilMoisture20cmPct: Number(soilMoisture20cmPct.toFixed(2)),
      soilMoisture40cmPct: Number(soilMoisture40cmPct.toFixed(2)),
    });
  }

  get soilMoisture20cmPct(): number {
    return this.props.soilMoisture20cmPct;
  }

  get soilMoisture40cmPct(): number {
    return this.props.soilMoisture40cmPct;
  }
}
