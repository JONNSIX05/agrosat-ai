import { ValueObject } from '@agrosat/shared-kernel';
import { InvalidTelemetryReadingException } from '../exceptions/telemetry-domain.exceptions';

interface AmbientClimateProps {
  ambientTempC: number;
  relativeHumidityPct: number;
  solarRadiationWm2: number;
  vpdKpa: number;
}

export class AmbientClimateVo extends ValueObject<AmbientClimateProps> {
  private constructor(props: AmbientClimateProps) {
    super(props);
  }

  /**
   * Valida variables climáticas y calcula automáticamente el Déficit de Presión de Vapor (VPD)
   * mediante la ecuación agrometeorológica de Tetens.
   */
  public static create(params: {
    ambientTempC: number;
    relativeHumidityPct: number;
    solarRadiationWm2: number;
  }): AmbientClimateVo {
    const { ambientTempC, relativeHumidityPct, solarRadiationWm2 } = params;

    if (!Number.isFinite(ambientTempC) || ambientTempC < -25 || ambientTempC > 65) {
      throw new InvalidTelemetryReadingException(
        `Temperatura ambiente fuera de rango físico [-25°C, 65°C]: ${ambientTempC}`,
      );
    }
    if (
      !Number.isFinite(relativeHumidityPct) ||
      relativeHumidityPct < 1 ||
      relativeHumidityPct > 100
    ) {
      throw new InvalidTelemetryReadingException(
        `Humedad relativa fuera de rango [1%, 100%]: ${relativeHumidityPct}`,
      );
    }
    if (!Number.isFinite(solarRadiationWm2) || solarRadiationWm2 < 0 || solarRadiationWm2 > 1600) {
      throw new InvalidTelemetryReadingException(
        `Radiación solar fuera de rango [0, 1600 W/m²]: ${solarRadiationWm2}`,
      );
    }

    // Ecuación de Tetens: es(T) = 0.61078 * exp((17.27 * T) / (T + 237.3)) [kPa]
    const saturationVaporPressureKpa =
      0.61078 * Math.exp((17.27 * ambientTempC) / (ambientTempC + 237.3));
    const vpdKpa = Math.max(
      0,
      Number((saturationVaporPressureKpa * (1 - relativeHumidityPct / 100)).toFixed(3)),
    );

    return new AmbientClimateVo({
      ambientTempC: Number(ambientTempC.toFixed(2)),
      relativeHumidityPct: Number(relativeHumidityPct.toFixed(2)),
      solarRadiationWm2: Number(solarRadiationWm2.toFixed(1)),
      vpdKpa,
    });
  }

  get ambientTempC(): number {
    return this.props.ambientTempC;
  }

  get relativeHumidityPct(): number {
    return this.props.relativeHumidityPct;
  }

  get solarRadiationWm2(): number {
    return this.props.solarRadiationWm2;
  }

  get vpdKpa(): number {
    return this.props.vpdKpa;
  }
}
