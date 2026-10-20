import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  function context(user?: { role?: string }): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  it('allows an admin', () => {
    expect(guard.canActivate(context({ role: 'admin' }))).toBe(true);
  });

  it.each([{ role: 'user' }, { role: 'Admin' }, {}, undefined])(
    'rejects a request without the admin role: %j',
    (user) => {
      expect(() => guard.canActivate(context(user))).toThrow(
        ForbiddenException,
      );
    },
  );
});
