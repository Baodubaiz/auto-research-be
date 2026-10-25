import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * Hoàn tất job treo ở bước `need_data_analyze` (T-11):
 * FE chạy `analyzer` xong → gửi `analyzeLog` (kết quả phân tích) về để AI viết tiếp.
 */
export class ResumeDataAnalysisDto {
  @IsString()
  @IsNotEmpty({ message: 'analyzeLog là bắt buộc để viết tiếp' })
  analyzeLog!: string;

  /** Log chi tiết của bước phân tích (tuỳ chọn, chuyển tiếp cho AI). */
  @IsOptional()
  @IsArray()
  detailedLogs?: Array<Record<string, unknown>>;

  /** File sinh ra ở bước phân tích (biểu đồ/bảng) nếu có. */
  @IsOptional()
  @IsObject()
  generatedFiles?: Record<string, unknown>;

  /** Ghi đè `thread_id` nếu FE giữ thread khác với job đang treo. */
  @IsOptional()
  @IsString()
  threadId?: string;
}
