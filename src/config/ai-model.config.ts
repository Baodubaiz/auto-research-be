import { registerAs } from '@nestjs/config';

declare const process: { env: Record<string, string | undefined> };

export interface AiModelConfig {
  defaultModel: string;
  allowedModels: string[];
}

/**
 * Nguồn sự thật DUY NHẤT cho cấu hình AI Model toàn hệ thống.
 * Đọc trực tiếp từ biến môi trường:
 * - AI_DEFAULT_MODEL (fallback DEFAULT_AI_MODEL cho tương thích ngược)
 * - AI_ALLOWED_MODELS (danh sách phân tách bằng dấu phẩy)
 */
export function resolveAiModelConfig(): AiModelConfig {
  const rawDefault = (
    process.env.AI_DEFAULT_MODEL ||
    process.env.DEFAULT_AI_MODEL ||
    ''
  ).trim();

  const rawAllowed = (
    process.env.AI_ALLOWED_MODELS || 'gemini-3.5-flash-lite,localhost'
  ).trim();

  const allowedModels = rawAllowed
    .split(',')
    .map((m: string) => m.trim())
    .filter(Boolean);

  const defaultModel = rawDefault || allowedModels[0] || 'gemini-3.5-flash-lite';

  if (!allowedModels.includes(defaultModel)) {
    allowedModels.unshift(defaultModel);
  }

  return {
    defaultModel,
    allowedModels,
  };
}

export default registerAs('aiModel', resolveAiModelConfig);
