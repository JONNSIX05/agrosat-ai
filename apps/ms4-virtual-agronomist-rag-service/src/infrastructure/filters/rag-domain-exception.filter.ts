import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { DomainException } from '@agrosat/shared-kernel';
import { Response } from 'express';

@Catch(DomainException)
export class RagDomainExceptionFilter implements ExceptionFilter {
  public catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: exception.code,
      message: exception.message,
      details: exception.details ?? {},
      timestamp: new Date().toISOString(),
    });
  }
}
