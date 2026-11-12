import { TriggeredAlertAggregate } from '../../../domain/entities/triggered-alert.aggregate';
import { ParcelSubscriberContext } from './farmer-alert-repository.port';

export const ALERT_WEBHOOK_DISPATCHER_PORT = Symbol('ALERT_WEBHOOK_DISPATCHER_PORT');

export interface AlertWebhookDispatcherPort {
  dispatchAlertToN8n(
    alert: TriggeredAlertAggregate,
    subscriber: ParcelSubscriberContext,
  ): Promise<boolean>;
}
