import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * `translate_report` (hợp đồng 7.9 + Phụ lục C.5).
 * `target_language` là **chuỗi tự do** ("English", "Tiếng Việt") — AI nhúng trực tiếp vào prompt.
 */
export class TranslateReportDto {
  @IsString()
  @IsNotEmpty()
  targetLanguage!: string;

  /** `true` = chỉ dịch đề cương (`translatedOutline`), `false` = toàn văn (`translatedContent`). */
  @IsOptional()
  @IsBoolean()
  isOutline?: boolean;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  modelId?: string;
}
