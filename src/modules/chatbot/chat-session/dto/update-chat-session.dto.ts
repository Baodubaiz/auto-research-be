import { ChatMode } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateChatSessionDto {
  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsEnum(ChatMode)
  mode?: ChatMode;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  webSearchEnabled?: boolean;
}