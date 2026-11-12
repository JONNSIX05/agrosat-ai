import { DomainException } from '@agrosat/shared-kernel';

export class InvalidTelemetryReadingException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super('INVALID_TELEMETRY_READING', message, details);
  }
}
