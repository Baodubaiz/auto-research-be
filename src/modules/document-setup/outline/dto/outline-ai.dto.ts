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
  wordCountStr?: string;

  @IsOptional()
  researchType?: any;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsArray()
  headings?: any[];

  @IsOptional()
  @IsArray()
  headingsPercent?: number[];

  @IsOptional()
  @IsArray()
  outlineCode?: string[];

  @IsOptional()
  finalProposal?: any;


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

  @IsOptional()
  @IsString()
  instruction?: string;

  @IsOptional()
  outline?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  headings?: any[];

  @IsOptional()
  @IsArray()
  headingsPercent?: number[];

  @IsOptional()
  @IsArray()
  newHeadings?: any[];

  @IsOptional()
  @IsArray()
  newHeadingsPercent?: number[];

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  researchType?: any;

  @IsOptional()
  finalProposal?: any;


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
  @IsArray()
  outlineCode?: string[];

  @IsOptional()
  finalProposal?: any;

  @IsOptional()
  @IsArray()
  processedDocs?: any[];


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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  referenceIds?: string[];

  @IsOptional()
  @IsArray()
  documents?: any[];


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
  dto: { language?: string; [key: string]: any };
  kafkaData: Record<string, unknown>;
  onSuccess?: (data: Record<string, unknown>) => Promise<void>;
}
