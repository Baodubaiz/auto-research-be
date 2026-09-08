import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        errorMessage = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        errorMessage = resObj.message || exception.message;
        errorCode = resObj.error || HttpStatus[status] || 'HTTP_ERROR';
        if (Array.isArray(errorMessage)) {
          errorMessage = errorMessage.join(', ');
        }
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
      this.logger.error(exception.stack);
    }

    response.status(status).json({
      status: 'error',
      error_code: errorCode,
      error: errorMessage,
    });
  }
}
