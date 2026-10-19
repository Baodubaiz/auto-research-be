import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKeyHeader = request.headers['x-api-key'];
    const configuredKey =
      this.configService.get<string>('API_KEY_ID') ||
      process.env.API_KEY_ID ||
      'autoresearch-ai-secret-key';

    if (!apiKeyHeader) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    const providedKey = Array.isArray(apiKeyHeader)
      ? apiKeyHeader[0]
      : apiKeyHeader;

    if (providedKey !== configuredKey) {
      throw new UnauthorizedException('Invalid x-api-key header');
    }

    return true;
  }
}
