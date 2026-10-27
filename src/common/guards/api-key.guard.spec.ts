import { jest } from '@jest/globals';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: (jest.fn() as any).mockImplementation((key: string) => {
        if (key === 'API_KEY_ID') return 'test-secret-key';
        return undefined;
      }),
    } as unknown as ConfigService;
    guard = new ApiKeyGuard(configService);
  });

  const createMockContext = (headerValue?: string | string[]): ExecutionContext => {
    const request = {
      headers: {
        'x-api-key': headerValue,
      },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access when x-api-key matches configured key', () => {
    const context = createMockContext('test-secret-key');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when x-api-key is an array with matching first element', () => {
    const context = createMockContext(['test-secret-key']);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedException when header is missing', () => {
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Missing x-api-key header');
  });

  it('should throw UnauthorizedException when header does not match', () => {
    const context = createMockContext('wrong-key');
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Invalid x-api-key header');
  });

  it('should throw UnauthorizedException when header has same length but incorrect content', () => {
    const context = createMockContext('test-secret-bad');
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Invalid x-api-key header');
  });
});
