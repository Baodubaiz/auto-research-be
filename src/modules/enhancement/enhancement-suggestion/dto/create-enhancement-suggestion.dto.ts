import { SuggestionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateEnhancementSuggestionDto {
  @IsString()
  sessionId!: string;

  @IsString()
  suggestedText!: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsEnum(SuggestionStatus)
  status?: SuggestionStatus;
}