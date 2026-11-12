import { Inject, Injectable } from '@nestjs/common';
import { TriggeredAlertResponseDto } from '../dtos/farmer-alert.dto';
import {
  FARMER_ALERT_REPOSITORY_PORT,
  FarmerAlertRepositoryPort,
} from '../ports/out/farmer-alert-repository.port';

@Injectable()
export class ListParcelAlertsUseCase {
  constructor(
    @Inject(FARMER_ALERT_REPOSITORY_PORT)
    private readonly alertRepo: FarmerAlertRepositoryPort,
  ) {}

  public async execute(parcelId: string, limit = 30): Promise<TriggeredAlertResponseDto[]> {
    const alerts = await this.alertRepo.findAlertsByParcelId(parcelId, limit);
    return alerts.map((a) => ({
      alertId: a.id,
      parcelId: a.parcelId,
      farmerId: a.farmerId,
      ruleCode: a.ruleCode,
      severity: a.severity,
      title: a.title,
      recommendedAction: a.recommendedAction,
      triggerMetrics: a.triggerMetrics,
      n8nWebhookStatus: a.n8nWebhookStatus,
      triggeredAt: a.triggeredAt.toISOString(),
    }));
  }
}
