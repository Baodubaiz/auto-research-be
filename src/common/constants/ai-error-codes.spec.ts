import { describe, it, expect } from '@jest/globals';
import {
  getAiErrorDetail,
  getAiErrorMessage,
  getAiErrorName,
  isAiErrorCode,
} from './ai-error-codes';

describe('AiErrorCodes', () => {
  it('should return correct details for common LLM error 401', () => {
    const detail = getAiErrorDetail(401);
    expect(detail.name).toBe('LLM_AUTHENTICATION_ERROR');
    expect(detail.message).toContain('API');
  });

  it('should return correct details for system code 603 (INVALID_PARAMS)', () => {
    expect(getAiErrorName(603)).toBe('INVALID_PARAMS');
    expect(getAiErrorMessage(603)).toContain('Tham số yêu cầu không hợp lệ');
  });

  it('should return correct details for write report code 630', () => {
    expect(getAiErrorName('630')).toBe('WRITE_CONTENT_ERROR');
    expect(getAiErrorMessage('630')).toContain('soạn thảo nội dung');
  });

  it('should return correct details for web search code 701', () => {
    expect(getAiErrorName(701)).toBe('INVALID_SEARCH_KEY');
    expect(getAiErrorMessage(701)).toContain('Khóa API tìm kiếm');
  });

  it('should identify valid and invalid error codes with isAiErrorCode', () => {
    expect(isAiErrorCode(401)).toBe(true);
    expect(isAiErrorCode(604)).toBe(true);
    expect(isAiErrorCode(610)).toBe(true);
    expect(isAiErrorCode(650)).toBe(true);
    expect(isAiErrorCode(670)).toBe(true);
    expect(isAiErrorCode(704)).toBe(true);
    expect(isAiErrorCode(9999)).toBe(false);
  });

  it('should return fallback message for unknown error code', () => {
    const detail = getAiErrorDetail(8888);
    expect(detail.name).toBe('AI_UNKNOWN_ERROR');
    expect(detail.message).toContain('8888');
  });
});
