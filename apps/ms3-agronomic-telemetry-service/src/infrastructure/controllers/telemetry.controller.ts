import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TelemetrySummaryContextDto } from '@agrosat/service-contracts';
import { IngestTelemetryReadingRequestDto } from '../../application/dtos/ingest-telemetry.dto';
import { GetParcelTelemetryHistoryUseCase } from '../../application/use-cases/get-parcel-telemetry-history.use-case';
import { IngestTelemetryReadingUseCase } from '../../application/use-cases/ingest-telemetry-reading.use-case';

@Controller()
export class TelemetryController {
  constructor(
    private readonly ingestReadingUseCase: IngestTelemetryReadingUseCase,
    private readonly getHistoryUseCase: GetParcelTelemetryHistoryUseCase,
  ) {}

  @Get('health')
  public healthCheck() {
    return {
      service: 'ms3-agronomic-telemetry-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // ENDPOINTS PÚBLICOS E INGESTA DESDE NODE-RED (:18880) Y GATEWAY (:18080)
  // ==========================================================================

  @Post('api/v1/telemetry/readings')
  public async ingestReading(@Body() body: IngestTelemetryReadingRequestDto) {
    return this.ingestReadingUseCase.execute(body);
  }

  @Post('api/v1/telemetry/ingest')
  public async ingestReadingAlias(@Body() body: IngestTelemetryReadingRequestDto) {
    return this.ingestReadingUseCase.execute(body);
  }

  @Post('internal/v1/telemetry/ingest')
  public async ingestInternalReading(@Body() body: IngestTelemetryReadingRequestDto) {
    return this.ingestReadingUseCase.execute(body);
  }

  @Get('api/v1/telemetry/parcels/:parcelId/history')
  public async getParcelTelemetryHistory(
    @Param('parcelId') parcelId: string,
    @Query('limit') limit?: string,
  ) {
    return this.getHistoryUseCase.execute(parcelId, limit ? Number(limit) : 48);
  }

  // ==========================================================================
  // ENDPOINT INTERNO (Consumido por MS4 Virtual Agronomist RAG)
  // ==========================================================================

  @Get('internal/v1/telemetry/:parcelId/summary')
  public async getInternalTelemetrySummary(
    @Param('parcelId') parcelId: string,
  ): Promise<TelemetrySummaryContextDto> {
    const result = await this.getHistoryUseCase.execute(parcelId, 5);
    return result.summary;
  }
}
