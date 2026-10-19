import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class WriterChatbotDto {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsOptional()
  @IsBoolean()
  resume?: boolean;

  @IsOptional()
  @IsString()
  templateKey?: string;

  @IsOptional()
  @IsBoolean()
  shortAnswer?: boolean;

  @IsOptional()
  @IsBoolean()
  useWebSearchChatbot?: boolean;

  @IsOptional()
  @IsString()
  modelId?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class StartWriterAgentDto {
  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsString()
  instruction?: string;

  @IsOptional()
  @IsString()
  modelId?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  chatHistory?: string;

  @IsOptional()
  @IsObject()
  summary?: Record<string, unknown>;

  @IsOptional()
  outline?: string | Record<string, unknown>;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsArray()
  notes?: string[];

  @IsOptional()
  @IsBoolean()
  useWebSearch?: boolean;

  @IsOptional()
  @IsNumber()
  maxResearchIterations?: number;

  @IsOptional()
  @IsBoolean()
  resumeError?: boolean;
}

export class ResumeWriterAgentDto {
  @IsOptional()
  @IsString()
  userInput?: string;

  @IsOptional()
  @IsString()
  resumeStep?: string;
}
