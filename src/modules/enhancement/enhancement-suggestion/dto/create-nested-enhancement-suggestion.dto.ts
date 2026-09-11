import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SuggestionStatus } from '@prisma/client';

export class CreateNestedEnhancementSuggestionDto {
  @IsString()
  suggestedText!: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsEnum(SuggestionStatus)
  status?: SuggestionStatus;
}