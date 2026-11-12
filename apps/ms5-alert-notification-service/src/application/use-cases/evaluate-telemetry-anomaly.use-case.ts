import { Inject, Injectable, Logger } from '@nestjs/common';
import { TelemetryAnomalyEventPayload } from '@agrosat/service-contracts';
import { TriggeredAlertAggregate } from '../../domain/entities/triggered-alert.aggregate';
import { WatermelonAnomalyEvaluatorDomainService } from '../../domain/services/watermelon-anomaly-evaluator.domain-service';
import { TriggeredAlertResponseDto } from '../dtos/farmer-alert.dto';
import {
  ALERT_WEBHOOK_DISPATCHER_PORT,
  AlertWebhookDispatcherPort,
} from '../ports/out/alert-webhook-dispatcher.port';
import {
  FARMER_ALERT_REPOSITORY_PORT,
  FarmerAlertRepositoryPort,
} from '../ports/out/farmer-alert-repository.port';

@Injectable()
export class EvaluateTelemetryAnomalyUseCase {
  private readonly logger = new Logger(EvaluateTelemetryAnomalyUseCase.name);
  private readonly evaluator = new WatermelonAnomalyEvaluatorDomainService();

  constructor(
    @Inject(FARMER_ALERT_REPOSITORY_PORT)
    private readonly alertRepo: FarmerAlertRepositoryPort,
    @Inject(ALERT_WEBHOOK_DISPATCHER_PORT)
    private readonly webhookDispatcher: AlertWebhookDispatcherPort,
  ) {}

  public async execute(
    event: TelemetryAnomalyEventPayload,
  ): Promise<TriggeredAlertResponseDto | null> {
    const matchedRule = this.evaluator.evaluateTelemetryEvent(event);
    if (!matchedRule) {
      return null;
    }

    const subscriber = await this.alertRepo.findSubscriberForParcel(event.parcelId);
    if (!subscriber) {
      this.logger.warn(`No se encontró agricultor suscrito para la parcela ${event.parcelId}`);
      return null;
    }

    const alertAggregate = TriggeredAlertAggregate.create({
      parcelId: event.parcelId,
      farmerId: subscriber.farmer.id,
      ruleCode: matchedRule.ruleCode,
      severity: matchedRule.severity,
      title: matchedRule.title,
      recommendedAction: matchedRule.recommendedAction,
      triggerMetrics: {
        readingId: event.readingId,
        ambientTempC: event.ambientTempC,
        relativeHumidityPct: event.relativeHumidityPct,
        soilMoisture20cmPct: event.soilMoisture20cmPct,
        soilMoisture40cmPct: event.soilMoisture40cmPct,
        solarRadiationWm2: event.solarRadiationWm2,
        vpdKpa: event.vpdKpa,
      },
    });

    await this.alertRepo.saveTriggeredAlert(alertAggregate);

    const delivered = await this.webhookDispatcher.dispatchAlertToN8n(alertAggregate, subscriber);
    const finalStatus = delivered ? 'SENT_TO_N8N' : 'FAILED_N8N_UNREACHABLE';
    alertAggregate.markWebhookStatus(finalStatus);
    await this.alertRepo.updateAlertWebhookStatus(alertAggregate.id, finalStatus);

    return {
      alertId: alertAggregate.id,
      parcelId: alertAggregate.parcelId,
      farmerId: alertAggregate.farmerId,
      ruleCode: alertAggregate.ruleCode,
      severity: alertAggregate.severity,
      title: alertAggregate.title,
      recommendedAction: alertAggregate.recommendedAction,
      triggerMetrics: alertAggregate.triggerMetrics,
      n8nWebhookStatus: alertAggregate.n8nWebhookStatus,
      triggeredAt: alertAggregate.triggeredAt.toISOString(),
    };
  }
}
