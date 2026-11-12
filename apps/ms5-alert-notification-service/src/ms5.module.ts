import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from '@agrosat/shared-kernel';
import { ALERT_WEBHOOK_DISPATCHER_PORT } from './application/ports/out/alert-webhook-dispatcher.port';
import { FARMER_ALERT_REPOSITORY_PORT } from './application/ports/out/farmer-alert-repository.port';
import { EvaluateSpectralAnomalyUseCase } from './application/use-cases/evaluate-spectral-anomaly.use-case';
import { EvaluateTelemetryAnomalyUseCase } from './application/use-cases/evaluate-telemetry-anomaly.use-case';
import { ListParcelAlertsUseCase } from './application/use-cases/list-parcel-alerts.use-case';
import { RegisterFarmerTelegramUseCase } from './application/use-cases/register-farmer-telegram.use-case';
import { N8nWebhookAdapter } from './infrastructure/adapters/n8n-webhook.adapter';
import { PostgresFarmerAlertRepository } from './infrastructure/adapters/postgres-farmer-alert.repository';
import { AlertNotificationController } from './infrastructure/controllers/alert-notification.controller';
import { PgAnomalyChannelsListener } from './infrastructure/listeners/pg-anomaly-channels.listener';

@Module({
  imports: [PostgresDatabaseModule],
  controllers: [AlertNotificationController],
  providers: [
    RegisterFarmerTelegramUseCase,
    EvaluateTelemetryAnomalyUseCase,
    EvaluateSpectralAnomalyUseCase,
    ListParcelAlertsUseCase,
    PgAnomalyChannelsListener,
    {
      provide: FARMER_ALERT_REPOSITORY_PORT,
      useClass: PostgresFarmerAlertRepository,
    },
    {
      provide: ALERT_WEBHOOK_DISPATCHER_PORT,
      useClass: N8nWebhookAdapter,
    },
  ],
})
export class Ms5AlertNotificationModule {}
