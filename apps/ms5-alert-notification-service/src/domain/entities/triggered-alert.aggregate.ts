import { AggregateRoot } from '@agrosat/shared-kernel';
import {
  AlertSeverityLevel,
  WatermelonAlertRuleCode,
} from '../value-objects/watermelon-alert-rule.vo';

export type N8nWebhookDispatchStatus = 'PENDING' | 'SENT_TO_N8N' | 'FAILED_N8N_UNREACHABLE';

export interface TriggeredAlertProps {
  parcelId: string;
  farmerId: string;
  ruleCode: WatermelonAlertRuleCode;
  severity: AlertSeverityLevel;
  title: string;
  recommendedAction: string;
  triggerMetrics: Record<string, unknown>;
  n8nWebhookStatus: N8nWebhookDispatchStatus;
  triggeredAt: Date;
}

export class TriggeredAlertAggregate extends AggregateRoot<TriggeredAlertProps> {
  private constructor(props: TriggeredAlertProps, id?: string) {
    super(props, id);
  }

  public static create(
    params: Omit<TriggeredAlertProps, 'n8nWebhookStatus' | 'triggeredAt'> & {
      n8nWebhookStatus?: N8nWebhookDispatchStatus;
      triggeredAt?: Date;
    },
    id?: string,
  ): TriggeredAlertAggregate {
    return new TriggeredAlertAggregate(
      {
        ...params,
        n8nWebhookStatus: params.n8nWebhookStatus ?? 'PENDING',
        triggeredAt: params.triggeredAt ?? new Date(),
      },
      id,
    );
  }

  public markWebhookStatus(status: N8nWebhookDispatchStatus): void {
    this.props.n8nWebhookStatus = status;
  }

  get parcelId(): string {
    return this.props.parcelId;
  }

  get farmerId(): string {
    return this.props.farmerId;
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

  get triggerMetrics(): Record<string, unknown> {
    return this.props.triggerMetrics;
  }

  get n8nWebhookStatus(): N8nWebhookDispatchStatus {
    return this.props.n8nWebhookStatus;
  }

  get triggeredAt(): Date {
    return this.props.triggeredAt;
  }
}
