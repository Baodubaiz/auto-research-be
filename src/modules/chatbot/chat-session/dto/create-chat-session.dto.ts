import { ChatMode } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateChatSessionDto {
  @IsOptional()
  @IsString()
  documentId?: string;

  @IsEnum(ChatMode)
  mode!: ChatMode;

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