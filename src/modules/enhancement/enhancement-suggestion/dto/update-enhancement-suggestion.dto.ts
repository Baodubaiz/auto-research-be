import { SuggestionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateEnhancementSuggestionDto {
  @IsOptional()
  @IsString()
  suggestedText?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsEnum(SuggestionStatus)
  status?: SuggestionStatus;
}