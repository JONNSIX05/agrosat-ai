import { TelemetryAnomalyEventPayload } from '@agrosat/service-contracts';

export const TELEMETRY_ANOMALY_PUBLISHER_PORT = Symbol('TELEMETRY_ANOMALY_PUBLISHER_PORT');

export interface TelemetryAnomalyPublisherPort {
  publishTelemetryAnomaly(event: TelemetryAnomalyEventPayload): Promise<void>;
}
