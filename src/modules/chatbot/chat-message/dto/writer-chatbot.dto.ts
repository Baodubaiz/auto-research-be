import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}

export class ResumeWriterAgentDto {
  @IsOptional()
  @IsString()
  userInput?: string;

  @IsOptional()
  @IsString()
  resumeStep?: string;
}
