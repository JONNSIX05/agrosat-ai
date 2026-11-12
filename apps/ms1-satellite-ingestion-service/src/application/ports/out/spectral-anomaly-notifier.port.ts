import { SpectralAnomalyEventPayload } from '@agrosat/service-contracts';

export const SPECTRAL_ANOMALY_NOTIFIER_PORT = Symbol('SPECTRAL_ANOMALY_NOTIFIER_PORT');

export interface SpectralAnomalyNotifierPort {
  notifySpectralAnomaly(event: SpectralAnomalyEventPayload): Promise<void>;
}
