import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  SpectralAnomalyEventPayload,
  TelemetryAnomalyEventPayload,
} from '@agrosat/service-contracts';
import { RegisterFarmerSubscriptionRequestDto } from '../../application/dtos/farmer-alert.dto';
import { ListParcelAlertsUseCase } from '../../application/use-cases/list-parcel-alerts.use-case';
import { RegisterFarmerTelegramUseCase } from '../../application/use-cases/register-farmer-telegram.use-case';
import { PgAnomalyChannelsListener } from '../listeners/pg-anomaly-channels.listener';

@Controller()
export class AlertNotificationController {
  constructor(
    private readonly registerFarmerUseCase: RegisterFarmerTelegramUseCase,
    private readonly listParcelAlertsUseCase: ListParcelAlertsUseCase,
    private readonly anomalyListener: PgAnomalyChannelsListener,
  ) {}

  @Get('health')
  public healthCheck() {
    return {
      service: 'ms5-alert-notification-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // ENDPOINTS PÚBLICOS (Consumidos vía agrosat_gateway :18080)
  // ==========================================================================

  @Post('api/v1/alerts/farmers')
  public async registerOrUpdateFarmer(@Body() body: RegisterFarmerSubscriptionRequestDto) {
    return this.registerFarmerUseCase.execute(body);
  }

  @Get('api/v1/alerts/parcels/:parcelId')
  public async listAlertsForParcel(
    @Param('parcelId') parcelId: string,
    @Query('limit') limit?: string,
  ) {
    return this.listParcelAlertsUseCase.execute(parcelId, limit ? Number(limit) : 30);
  }

  // ==========================================================================
  // ENDPOINTS INTERNOS (Fallback directo desde MS3 Telemetry y MS1 Satellite)
  // ==========================================================================

  @Post('internal/v1/alerts/evaluate-telemetry')
  public async evaluateTelemetry(@Body() event: TelemetryAnomalyEventPayload) {
    const alert = await this.anomalyListener.handleTelemetryEventOnce(event);
    return {
      evaluated: true,
      triggeredAlert: alert,
    };
  }

  @Post('internal/v1/alerts/evaluate-ndvi')
  public async evaluateNdviDrop(@Body() event: SpectralAnomalyEventPayload) {
    const alert = await this.anomalyListener.handleSpectralEventOnce(event);
    return {
      evaluated: true,
      triggeredAlert: alert,
    };
  }
}
