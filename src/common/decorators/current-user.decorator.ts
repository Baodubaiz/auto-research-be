import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user || {
      id: request.headers['x-user-id'] || 'user-default-id',
    };
    return data ? user?.[data] : user;
  },
);
