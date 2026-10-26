const VALID_LEVELS = new Set([
  'CHUYEN_DE',
  'LUAN_AN_TIEN_SI',
  'LUAN_VAN_THAC_SI',
  'KHOA_LUAN',
  'TIEU_LUAN',
  'BAI_BAO_KHOA_HOC',
]);

export function normalizeAcademicLevel(level?: string): string {
  if (!level) return 'KHOA_LUAN';
  const upper = level.trim().toUpperCase();
  if (VALID_LEVELS.has(upper)) {
    return upper;
  }
  const lower = level.toLowerCase();
  if (
    lower.includes('phd') ||
    lower.includes('tiến sĩ') ||
    lower.includes('tien si') ||
    lower.includes('luận án')
  ) {
    return 'LUAN_AN_TIEN_SI';
  }
  if (
    lower.includes('master') ||
    lower.includes('thạc sĩ') ||
    lower.includes('thac si') ||
    lower.includes('luận văn')
  ) {
    return 'LUAN_VAN_THAC_SI';
  }
  if (
    lower.includes('bachelor') ||
    lower.includes('cử nhân') ||
    lower.includes('đại học') ||
    lower.includes('khóa luận') ||
    lower.includes('khoa luan')
  ) {
    return 'KHOA_LUAN';
  }
  if (lower.includes('tiểu luận') || lower.includes('tieu luan')) {
    return 'TIEU_LUAN';
  }
  if (
    lower.includes('báo') ||
    lower.includes('paper') ||
    lower.includes('journal') ||
    lower.includes('nghiên cứu')
  ) {
    return 'BAI_BAO_KHOA_HOC';
  }
  return 'KHOA_LUAN';
}

export function normalizeAiLanguage(lang?: string): string {
  if (!lang) return 'tiếng việt';
  const lower = lang.toLowerCase();
  if (lower.includes('en') || lower === 'english') {
    return 'english';
  }
  return 'tiếng việt';
}

