import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

type AdminRequest = {
  user?: {
    role?: string;
  };
};

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AdminRequest>();

    if (request.user?.role !== 'admin') {
      throw new ForbiddenException(
        'Bạn không có quyền quản trị viên (Admin permission required)',
      );
    }

    return true;
  }
}
