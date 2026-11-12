import { Inject, Injectable } from '@nestjs/common';
import {
  TELEMETRY_REPOSITORY_PORT,
  TelemetryRepositoryPort,
} from '../ports/out/telemetry-repository.port';

@Injectable()
export class GetParcelTelemetryHistoryUseCase {
  constructor(
    @Inject(TELEMETRY_REPOSITORY_PORT)
    private readonly telemetryRepo: TelemetryRepositoryPort,
  ) {}

  public async execute(parcelId: string, limitReadings = 48) {
    return this.telemetryRepo.getClimaticSummaryAndHistory(parcelId, limitReadings);
  }
}
