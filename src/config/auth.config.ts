import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => {
  return {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  };
});
