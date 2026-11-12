export interface RegisterFarmerSubscriptionRequestDto {
  farmerId?: string;
  fullName: string;
  phoneNumber?: string;
  telegramChatId: string;
  telegramUsername?: string;
  parcelId?: string;
  parcelAlias?: string;
  cooldownMinutes?: number;
}

export interface TriggeredAlertResponseDto {
  alertId: string;
  parcelId: string;
  farmerId: string;
  ruleCode: string;
  severity: string;
  title: string;
  recommendedAction: string;
  triggerMetrics: Record<string, unknown>;
  n8nWebhookStatus: string;
  triggeredAt: string;
}
