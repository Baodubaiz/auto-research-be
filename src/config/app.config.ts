import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isLocal: process.env.IS_LOCAL === 'true' || process.env.NODE_ENV !== 'production',
  localLlmBaseUrl:
    process.env.LOCALLLM_BASE_URL ??
    'https://endless-alive-rooster.ngrok-free.app/v1',
}));
