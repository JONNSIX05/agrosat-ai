import { Injectable, Logger } from '@nestjs/common';
import { AlertWebhookDispatcherPort } from '../../application/ports/out/alert-webhook-dispatcher.port';
import { ParcelSubscriberContext } from '../../application/ports/out/farmer-alert-repository.port';
import { TriggeredAlertAggregate } from '../../domain/entities/triggered-alert.aggregate';

@Injectable()
export class N8nWebhookAdapter implements AlertWebhookDispatcherPort {
  private readonly logger = new Logger(N8nWebhookAdapter.name);
  private readonly n8nWebhookUrl =
    process.env.N8N_ALERT_WEBHOOK_URL ??
    'http://agrosat_n8n:5678/webhook/agrosat-watermelon-alert';

  public async dispatchAlertToN8n(
    alert: TriggeredAlertAggregate,
    subscriber: ParcelSubscriberContext,
  ): Promise<boolean> {
    const payload = {
      alertId: alert.id,
      ruleCode: alert.ruleCode,
      severity: alert.severity,
      title: alert.title,
      triggeredAt: alert.triggeredAt.toISOString(),
      farmer: {
        farmerId: subscriber.farmer.id,
        fullName: subscriber.farmer.fullName,
        telegramChatId:
          process.env.TELEGRAM_FARMER_CHAT_ID || subscriber.farmer.telegramChatId,
      },
      parcel: {
        parcelId: subscriber.parcelId,
        parcelAlias: subscriber.parcelAlias,
        centroid: subscriber.centroid,
      },
      metrics: alert.triggerMetrics,
      recommendedAction: alert.recommendedAction,
    };

    try {
      const response = await fetch(this.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        this.logger.log(
          `✅ Alerta ${alert.ruleCode} (${alert.id}) enviada exitosamente al Webhook n8n (${this.n8nWebhookUrl}).`,
        );
        return true;
      }

      this.logger.warn(
        `⚠️ n8n respondió HTTP ${response.status} al despachar alerta ${alert.id} (verifica que el workflow en n8n esté Activo).`,
      );
      return false;
    } catch (error) {
      this.logger.warn(
        `⚠️ No se pudo contactar al webhook de n8n (${this.n8nWebhookUrl}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }
}
