import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isLocal: process.env.IS_LOCAL === 'true' || process.env.NODE_ENV !== 'production',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  bodyLimit: process.env.BODY_LIMIT ?? '10mb',
  localLlmBaseUrl:
    process.env.LOCALLLM_BASE_URL ??
    'https://endless-alive-rooster.ngrok-free.app/v1',
}));
