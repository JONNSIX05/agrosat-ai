import {
  SpectralAnomalyEventPayload,
  TelemetryAnomalyEventPayload,
} from '@agrosat/service-contracts';
import { WatermelonAlertRuleVo } from '../value-objects/watermelon-alert-rule.vo';

export class WatermelonAnomalyEvaluatorDomainService {
  /**
   * Evalúa si una lectura telemétrica viola los umbrales críticos del cultivo de sandía:
   * - Regla 1: Helada (< 4.0°C)
   * - Regla 2: Golpe de calor (> 38.0°C) con humedad del suelo a 20cm < 25.0%
   */
  public evaluateTelemetryEvent(
    event: TelemetryAnomalyEventPayload,
  ): WatermelonAlertRuleVo | null {
    if (event.ambientTempC < 4.0) {
      return WatermelonAlertRuleVo.createFrostAlert(event.ambientTempC);
    }

    if (event.ambientTempC > 38.0 && event.soilMoisture20cmPct < 25.0) {
      return WatermelonAlertRuleVo.createHeatAndDroughtShockAlert(
        event.ambientTempC,
        event.soilMoisture20cmPct,
      );
    }

    return null;
  }

  /**
   * Evalúa si una pasada satelital Sentinel-2 presenta una caída brusca de NDVI (> 0.20)
   * o una mancha severa de estrés hídrico / plaga.
   */
  public evaluateSpectralEvent(event: SpectralAnomalyEventPayload): WatermelonAlertRuleVo | null {
    if (event.ndviDrop > 0.2 || (event.minNdvi <= 0.32 && event.stressedCellsPct > 5.0)) {
      return WatermelonAlertRuleVo.createSuddenNdviDropAlert(
        Math.max(event.ndviDrop, Number((event.previousMeanNdvi - event.minNdvi).toFixed(4))),
        event.minNdvi,
        event.stressPatchCenter?.anomalyCause,
      );
    }
    return null;
  }
}
