import { DomainException } from '@agrosat/shared-kernel';

export class InvalidFarmerSubscriptionException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super('INVALID_FARMER_SUBSCRIPTION', message, details);
  }
}
