import { registerAs } from '@nestjs/config';

export default registerAs('minio', () => ({
  endpoint: process.env.MINIO_ENDPOINT ?? 'http://167.254.70.125:9000',
  port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'minio_admin',
  secretKey: process.env.MINIO_SECRET_KEY ?? 'minio_password_local',
  bucket: process.env.MINIO_BUCKET ?? 'autoresearch-documents',
  region: process.env.MINIO_REGION ?? 'us-east-1',
  useSsl: process.env.MINIO_USE_SSL === 'true',
}));
