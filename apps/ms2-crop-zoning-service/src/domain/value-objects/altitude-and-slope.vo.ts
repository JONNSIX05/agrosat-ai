import { DomainException, ValueObject } from '@agrosat/shared-kernel';

interface AltitudeAndSlopeProps {
  altitudeMsnm: number;
  slopePct: number;
}

export class AltitudeAndSlopeVo extends ValueObject<AltitudeAndSlopeProps> {
  private constructor(props: AltitudeAndSlopeProps) {
    super(props);
  }

  public static create(altitudeMsnm: number, slopePct: number): AltitudeAndSlopeVo {
    if (!Number.isFinite(altitudeMsnm) || altitudeMsnm < -50 || altitudeMsnm > 4200) {
      throw new DomainException('INVALID_ALTITUDE', `Altitud inválida: ${altitudeMsnm} m.s.n.m.`);
    }
    if (!Number.isFinite(slopePct) || slopePct < 0 || slopePct > 75) {
      throw new DomainException('INVALID_SLOPE', `Pendiente topográfica inválida: ${slopePct}%.`);
    }
    return new AltitudeAndSlopeVo({
      altitudeMsnm: Number(altitudeMsnm.toFixed(1)),
      slopePct: Number(slopePct.toFixed(2)),
    });
  }

  get altitudeMsnm(): number {
    return this.props.altitudeMsnm;
  }

  get slopePct(): number {
    return this.props.slopePct;
  }

  /**
   * Puntaje combinado sobre 15 puntos máximos (Altitud 8 pts + Pendiente 7 pts).
   */
  public computeScoreOutOf15(): { score: number; limitingReason?: string; recommendation?: string } {
    let altScore = 8;
    let slopeScore = 7;
    const reasons: string[] = [];
    const recommendations: string[] = [];

    if (this.props.altitudeMsnm > 1000 && this.props.altitudeMsnm <= 1500) {
      altScore = 5;
      recommendations.push(
        'Altitud media (1000-1500 m.s.n.m.): usar acolchado plástico negro y microtúnel térmico en las primeras 3 semanas para acelerar grados-día.',
      );
    } else if (this.props.altitudeMsnm > 1500) {
      altScore = 2;
      reasons.push(`Altitud elevada (${this.props.altitudeMsnm} m.s.n.m.) con riesgo de noches frías (< 12°C) que frenan el desarrollo de la sandía`);
    }

    if (this.props.slopePct >= 3.0 && this.props.slopePct <= 6.0) {
      slopeScore = 5;
      recommendations.push(
        'Pendiente moderada (3-6%): trazar camas en curvas a nivel y utilizar cintilla de goteo autocompensada.',
      );
    } else if (this.props.slopePct > 6.0) {
      slopeScore = 2;
      reasons.push(`Pendiente pronunciada (${this.props.slopePct}% > 6%) con riesgo de escorrentía y desuniformidad de riego`);
      recommendations.push('Instalar goteros autocompensados y válvulas reguladoras de presión por sector.');
    }

    return {
      score: altScore + slopeScore,
      limitingReason: reasons.length > 0 ? reasons.join('; ') : undefined,
      recommendation: recommendations.length > 0 ? recommendations.join(' ') : undefined,
    };
  }
}
