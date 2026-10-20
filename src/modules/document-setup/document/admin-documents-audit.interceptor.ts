import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs';

@Injectable()
export class AdminDocumentsAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AdminDocumentsAuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const request = http.getRequest<{
      user: { sub: string; role: string };
      method: string;
      path: string;
    }>();
    // Only record verified identity and route metadata, never tokens or PDF URLs.
    const entry = {
      action: 'admin_documents_request',
      userId: request.user.sub,
      role: request.user.role,
      method: request.method,
      path: request.path,
    };

    return next.handle().pipe(
      tap({
        next: () =>
          this.logger.log({
            ...entry,
            outcome: 'completed',
            statusCode: http.getResponse<{ statusCode: number }>().statusCode,
          }),
        error: (error: unknown) =>
          this.logger.warn({
            ...entry,
            outcome: 'failed',
            statusCode:
              error instanceof HttpException ? error.getStatus() : 500,
          }),
      }),
    );
  }
}
