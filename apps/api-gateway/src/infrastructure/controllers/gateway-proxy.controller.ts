import {
  All,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ChaosSimulationRequest,
  UpstreamProxyService,
  UpstreamServiceKey,
} from '../../application/services/upstream-proxy.service';
import { WebDashboardSpaService } from '../dashboard/web-dashboard-spa.service';

@Controller()
export class GatewayProxyController {
  constructor(
    private readonly proxyService: UpstreamProxyService,
    private readonly dashboardSpa: WebDashboardSpaService,
  ) {}

  // ==========================================================================
  // 1. WEB GIS & AGRONOMIC COMMAND CENTER SPA (Servido en / y /dashboard)
  // ==========================================================================

  @Get()
  public serveDashboardRoot(@Res() res: Response): void {
    res
      .status(200)
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .send(this.dashboardSpa.renderHtml());
  }

  @Get('dashboard')
  public serveDashboardAlias(@Res() res: Response): void {
    res
      .status(200)
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .send(this.dashboardSpa.renderHtml());
  }

  // ==========================================================================
  // 2. HEALTHCHECK Y ESTADO INTEGRAL DEL ECOSISTEMA (MS1..MS5)
  // ==========================================================================

  @Get('health')
  public async healthCheck() {
    return this.proxyService.getEcosystemHealth();
  }

  @Get('api/v1/system/overview')
  public async getSystemOverview() {
    return this.proxyService.getEcosystemHealth();
  }

  // ==========================================================================
  // 3. ORQUESTADOR DE SIMULACIÓN CHAOS DEMO EN VIVO (MÓDULO 5)
  // ==========================================================================

  @Post('api/v1/simulation/trigger-chaos')
  public async triggerChaos(@Body() body: ChaosSimulationRequest) {
    return this.proxyService.triggerChaosScenario(body);
  }

  // ==========================================================================
  // 4. ENRUTAMIENTO REVERSE PROXY HACIA MICROSERVICIOS MS1..MS5
  // ==========================================================================

  @All(['api/v1/zoning', 'api/v1/zoning/*'])
  public async proxyToMs2Zoning(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.handleProxy('ms2', req, res);
  }

  @All(['api/v1/satellite', 'api/v1/satellite/*'])
  public async proxyToMs1Satellite(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.handleProxy('ms1', req, res);
  }

  @All(['api/v1/telemetry', 'api/v1/telemetry/*'])
  public async proxyToMs3Telemetry(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.handleProxy('ms3', req, res);
  }

  @All(['api/v1/agronomist', 'api/v1/agronomist/*'])
  public async proxyToMs4Agronomist(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.handleProxy('ms4', req, res);
  }

  @All(['api/v1/alerts', 'api/v1/alerts/*'])
  public async proxyToMs5Alerts(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.handleProxy('ms5', req, res);
  }

  private async handleProxy(
    target: UpstreamServiceKey,
    req: Request,
    res: Response,
  ): Promise<void> {
    const result = await this.proxyService.forwardRequest({
      target,
      method: req.method,
      pathWithQuery: req.originalUrl,
      body: req.body,
    });
    res.status(result.status).json(result.data);
  }
}
