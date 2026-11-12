import { ValueObject } from '@agrosat/shared-kernel';

export type WatermelonAlertRuleCode =
  | 'FROST_ALERT'
  | 'HEAT_AND_DROUGHT_SHOCK'
  | 'SUDDEN_NDVI_DROP';

export type AlertSeverityLevel = 'WARNING' | 'CRITICAL';

interface WatermelonAlertRuleProps {
  ruleCode: WatermelonAlertRuleCode;
  severity: AlertSeverityLevel;
  title: string;
  recommendedAction: string;
}

export class WatermelonAlertRuleVo extends ValueObject<WatermelonAlertRuleProps> {
  private constructor(props: WatermelonAlertRuleProps) {
    super(props);
  }

  public static createFrostAlert(ambientTempC: number): WatermelonAlertRuleVo {
    return new WatermelonAlertRuleVo({
      ruleCode: 'FROST_ALERT',
      severity: 'CRITICAL',
      title: `❄️ Alerta Crítica de Helada en Sandía (${ambientTempC}°C < 4.0°C)`,
      recommendedAction:
        'Riesgo inminente de daño celular por frío/helada en guías y flores de sandía. Activar riego por goteo o microaspersión continuo para liberar calor latente en cama de siembra y verificar cierre de microtúneles térmicos.',
    });
  }

  public static createHeatAndDroughtShockAlert(
    ambientTempC: number,
    soilMoisture20cmPct: number,
  ): WatermelonAlertRuleVo {
    return new WatermelonAlertRuleVo({
      ruleCode: 'HEAT_AND_DROUGHT_SHOCK',
      severity: 'CRITICAL',
      title: `🔥💧 Golpe de Calor (${ambientTempC}°C) y Déficit Hídrico Radicular (${soilMoisture20cmPct}% a 20cm)`,
      recommendedAction:
        'Estrés termo-hídrico crítico en zona radicular activa (< 25% humedad a 20cm con temperatura > 38°C). Alto riesgo de aborto de flores femeninas y necrosis apical (Blossom-End Rot). Aplicar pulso de riego de emergencia inmediato de 45 min con aporte de Nitrato de Calcio.',
    });
  }

  public static createSuddenNdviDropAlert(
    ndviDrop: number,
    minNdvi: number,
    anomalyCause?: string,
  ): WatermelonAlertRuleVo {
    return new WatermelonAlertRuleVo({
      ruleCode: 'SUDDEN_NDVI_DROP',
      severity: 'CRITICAL',
      title: `🛰️🥀 Caída Brusca de Vigor Satelital NDVI (-${ndviDrop.toFixed(2)} pts | Mín: ${minNdvi.toFixed(2)})`,
      recommendedAction: `Degradación abrupta del índice vegetativo en sector localizado (${
        anomalyCause ?? 'FUSARIUM_OR_DRIP_TAPE_FAILURE'
      }). Inspeccionar en campo de inmediato posible obstrucción/fuga en cintilla de riego por goteo, foco de marchitez vascular por Fusarium oxysporum o brote de araña roja.`,
    });
  }

  get ruleCode(): WatermelonAlertRuleCode {
    return this.props.ruleCode;
  }

  get severity(): AlertSeverityLevel {
    return this.props.severity;
  }

  get title(): string {
    return this.props.title;
  }

  get recommendedAction(): string {
    return this.props.recommendedAction;
  }
}
