import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateOutlineAiDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsOptional()
  @IsString()
  proposalId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  problemStatement?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(500)
  totalWordCount?: number = 8000;

  @IsOptional()
  @IsString()
  researchType?: string = 'quantitative';

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsString()
  modelId?: string = 'localhost';

  @IsOptional()
  @IsString()
  language?: string = 'vi';

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class ModifyOutlineAiDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  instruction!: string;

  @IsOptional()
  outline?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  modelId?: string = 'localhost';

  @IsOptional()
  @IsString()
  language?: string = 'vi';

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class GenerateOutlineWithRefsDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  referenceIds?: string[];

  @IsOptional()
  outline?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  modelId?: string = 'localhost';

  @IsOptional()
  @IsString()
  language?: string = 'vi';

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class UpdateUserRefsDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  referenceIds!: string[];

  @IsOptional()
  @IsString()
  modelId?: string = 'localhost';

  @IsOptional()
  @IsString()
  language?: string = 'vi';

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export interface OutlineAiDispatchOptions {
  userId: string;
  documentId: string;
  sessionId?: string;
  eventType: string;
  errorCode: number;
  dto: { modelId?: string; language?: string; [key: string]: any };
  kafkaData: Record<string, unknown>;
  onSuccess?: (data: Record<string, unknown>) => Promise<void>;
}
