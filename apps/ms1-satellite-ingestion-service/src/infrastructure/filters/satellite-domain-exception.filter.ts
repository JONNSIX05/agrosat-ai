import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DomainException } from '@agrosat/shared-kernel';
import { Response } from 'express';

@Catch()
export class SatelliteDomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof DomainException) {
      const status =
        exception.code === 'PARCEL_GEOMETRY_NOT_FOUND' ||
        exception.code === 'SATELLITE_SCENE_NOT_FOUND'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;

      response.status(status).json({
        statusCode: status,
        errorCode: exception.code,
        message: exception.message,
        details: exception.details ?? null,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(exception.getResponse());
      return;
    }

    const message =
      exception instanceof Error
        ? exception.message
        : 'Error interno en ms1-satellite-ingestion-service';
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
