import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class RecordTokenUsageDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsString()
  convId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsNotEmpty()
  @IsString()
  eventType!: string;

  @IsOptional()
  @IsString()
  modelId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  inputTokens?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  outputTokens?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  embedTokens?: number;

  @IsOptional()
  @IsString()
  embedModel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  webSearchCall?: number;
}

export interface TokenUsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEmbedTokens: number;
  totalWebSearchCalls: number;
  totalRequests: number;
}

export interface UserTokenUsageSummary extends TokenUsageSummary {
  userId: string;
}

export interface DocumentTokenUsageSummary extends TokenUsageSummary {
  documentId: string;
}
