import { FarmerProfileEntity } from '../../../domain/entities/farmer-profile.entity';
import {
  N8nWebhookDispatchStatus,
  TriggeredAlertAggregate,
} from '../../../domain/entities/triggered-alert.aggregate';

export const FARMER_ALERT_REPOSITORY_PORT = Symbol('FARMER_ALERT_REPOSITORY_PORT');

export interface ParcelSubscriberContext {
  farmer: FarmerProfileEntity;
  parcelId: string;
  parcelAlias: string;
  cooldownMinutes: number;
  centroid: { lon: number; lat: number };
}

export interface FarmerAlertRepositoryPort {
  upsertFarmerAndSubscription(params: {
    farmerId?: string;
    fullName: string;
    phoneNumber?: string;
    telegramChatId: string;
    telegramUsername?: string;
    parcelId: string;
    parcelAlias: string;
    cooldownMinutes: number;
  }): Promise<ParcelSubscriberContext>;

  findSubscriberForParcel(parcelId: string): Promise<ParcelSubscriberContext | null>;

  findFarmerByTelegramChatId(telegramChatId: string): Promise<ParcelSubscriberContext | null>;

  saveTriggeredAlert(alert: TriggeredAlertAggregate): Promise<TriggeredAlertAggregate>;

  updateAlertWebhookStatus(
    alertId: string,
    status: N8nWebhookDispatchStatus,
  ): Promise<void>;

  findAlertsByParcelId(parcelId: string, limit?: number): Promise<TriggeredAlertAggregate[]>;
}
