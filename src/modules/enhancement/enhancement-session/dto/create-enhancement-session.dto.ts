import { EnhancementType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateEnhancementSessionDto {
  @IsString()
  documentId!: string;

  @IsString()
  selectedText!: string;

  @IsOptional()
  @IsString()
  contextText?: string;

  @IsOptional()
  @IsString()
  userPrompt?: string;

  @IsOptional()
  @IsEnum(EnhancementType)
  enhancementType?: EnhancementType;
}