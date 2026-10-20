import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export enum AiInDocAction {
  rewrite = 'rewrite',
  expand = 'expand',
  shorten = 'shorten',
  make_academic = 'make_academic',
  fix_grammar = 'fix_grammar',
}

export class AiInDocDto {
  @IsUUID()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  sectionId!: string;

  @IsString()
  @IsNotEmpty()
  paragraphs!: string;

  @IsOptional()
  @IsString()
  paragraphContext?: string;

  @IsEnum(AiInDocAction)
  action!: AiInDocAction;

  @IsOptional()
  @IsObject()
  proposal?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  modelId?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class GetSuggestionsDto {
  @IsUUID()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  section!: string;

  @IsOptional()
  @IsString()
  sectionContext?: string;

  @IsOptional()
  @IsArray()
  processedDocs?: Array<Record<string, unknown>>;

  @IsOptional()
  @IsString()
  modelId?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class EnhanceDto {
  @IsUUID()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  section!: string;

  @IsObject()
  suggestedParagraph!: {
    original: string;
    suggestion: string;
  };

  @IsOptional()
  @IsUUID()
  suggestionId?: string;

  @IsOptional()
  @IsString()
  modelId?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class EnhanceAllDto {
  @IsUUID()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  section!: string;

  @IsArray()
  suggestedParagraphs!: Array<{
    original: string;
    suggestion: string;
  }>;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsString()
  modelId?: string;

  @IsOptional()
  @IsString()
  language?: string;
}
