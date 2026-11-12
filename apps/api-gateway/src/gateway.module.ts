import { Module } from '@nestjs/common';
import { UpstreamProxyService } from './application/services/upstream-proxy.service';
import { GatewayProxyController } from './infrastructure/controllers/gateway-proxy.controller';
import { WebDashboardSpaService } from './infrastructure/dashboard/web-dashboard-spa.service';

@Module({
  controllers: [GatewayProxyController],
  providers: [UpstreamProxyService, WebDashboardSpaService],
})
export class ApiGatewayModule {}
