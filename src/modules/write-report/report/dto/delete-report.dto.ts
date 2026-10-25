import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

/**
 * Event `delete_report` (hợp đồng §7.10 — hiệu chỉnh C.5 + B-4).
 * AI xoá best-effort: id nào lỗi thì trả `error_code: 640` + `failed_ids`.
 */
export class DeleteReportDto {
  /** Danh sách bài viết cần xoá (bắt buộc, tối thiểu 1). */
  @IsArray()
  @ArrayMinSize(1, { message: 'documentIds phải có ít nhất 1 phần tử' })
  @IsUUID('all', { each: true, message: 'documentIds phải là UUID hợp lệ' })
  documentIds!: string[];

  /** Danh sách thread LangGraph liên quan (AI xoá checkpoint Redis theo list này). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  threadIds?: string[];

  @IsOptional()
  @IsString()
  modelId?: string;
}
