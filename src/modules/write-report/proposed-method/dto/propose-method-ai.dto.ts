import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/** `research_type` theo hợp đồng mục 6.10: 0 = định tính, 1 = định lượng, 2 = hỗn hợp. */
export class ResearchTypeDto {
  @IsInt()
  @Min(0)
  @Max(2)
  type!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

/** Lượt đầu: AI đề xuất mô hình / giả thuyết / thang đo. */
export class ProposeMethodStartDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  /** AI trả lại trong response; BE nên sinh trước để map job. */
  @IsOptional()
  @IsString()
  threadId?: string;

  @IsObject()
  @IsNotEmptyObject()
  finalProposal!: Record<string, unknown>;

  @IsOptional()
  @ValidateNested()
  @Type(() => ResearchTypeDto)
  researchType?: ResearchTypeDto;

  @IsOptional()
  @IsString()
  userInput?: string;

  /**
   * `false` (mặc định của AI) = tương tác từng bước.
   * `true` = AI tự đề xuất ngay.
   */
  @IsOptional()
  @IsBoolean()
  autoMode?: boolean;

  /** `true` = kế thừa mô hình/biến đã có trong Mongo. */
  @IsOptional()
  @IsBoolean()
  inheritMode?: boolean;
}

/** Lượt tiếp: trả lời câu hỏi của AI (bắt buộc giữ nguyên `threadId`). */
export class ProposeMethodResumeDto {
  @IsString()
  @IsNotEmpty()
  threadId!: string;

  @IsString()
  @IsNotEmpty()
  userInput!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsObject()
  finalProposal?: Record<string, unknown>;

  @IsOptional()
  @ValidateNested()
  @Type(() => ResearchTypeDto)
  researchType?: ResearchTypeDto;
}
