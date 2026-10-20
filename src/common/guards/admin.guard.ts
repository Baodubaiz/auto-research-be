import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';

type AdminRequest = {
  user?: {
    sub?: string;
    role?: string;
  };
};

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AdminRequest>();

    if (request.user?.role !== 'admin') {
      this.logger.warn({
        action: 'admin_access_denied',
        userId: request.user?.sub,
        role: request.user?.role,
        statusCode: 403,
      });
      throw new ForbiddenException(
        'Bạn không có quyền quản trị viên (Admin permission required)',
      );
    }

    return true;
  }
}
