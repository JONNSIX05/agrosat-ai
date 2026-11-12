import { DomainException, ValueObject } from '@agrosat/shared-kernel';

interface SolarRadiationProps {
  mjPerM2Day: number;
}

export class SolarRadiationLevelVo extends ValueObject<SolarRadiationProps> {
  private constructor(props: SolarRadiationProps) {
    super(props);
  }

  public static create(mjPerM2Day: number): SolarRadiationLevelVo {
    if (!Number.isFinite(mjPerM2Day) || mjPerM2Day < 5 || mjPerM2Day > 40) {
      throw new DomainException(
        'INVALID_SOLAR_RADIATION',
        `Radiación solar diaria (${mjPerM2Day} MJ/m²/día) fuera de rango esperado [5, 40].`,
      );
    }
    return new SolarRadiationLevelVo({ mjPerM2Day: Number(mjPerM2Day.toFixed(2)) });
  }

  get value(): number {
    return this.props.mjPerM2Day;
  }

  /**
   * Puntaje sobre 15 puntos máximos (Óptimo sandía: 21 - 29 MJ/m²/día para altos grados Brix).
   */
  public computeScoreOutOf15(): { score: number; limitingReason?: string; recommendation?: string } {
    const rad = this.props.mjPerM2Day;
    if (rad >= 21.0 && rad <= 29.5) {
      return { score: 15 };
    }
    if (rad >= 17.5 && rad < 21.0) {
      return {
        score: 11,
        recommendation:
          'Radiación solar moderada: ampliar marco de plantación entre plantas (1.0 m) y reforzar Potasio en engorde para asegurar dulzor (°Brix).',
      };
    }
    if (rad > 29.5) {
      return {
        score: 12,
        recommendation:
          'Radiación solar muy intensa (> 29.5 MJ/m²/día): proteger frutos expuestos con caolín agrícola para prevenir golpe de sol en corteza.',
      };
    }
    return {
      score: 5,
      limitingReason: `Baja radiación solar (${rad} MJ/m²/día < 17.5) que limita la fotosíntesis y la acumulación de azúcares en sandía`,
      recommendation:
        'Utilizar acolchado plástico plata-negro reflectivo para incrementar radiación fotosintéticamente activa en el dosel.',
    };
  }
}
