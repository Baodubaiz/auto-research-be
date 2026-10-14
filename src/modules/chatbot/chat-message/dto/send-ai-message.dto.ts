import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendAiMessageDto {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsOptional()
  @IsBoolean()
  shortAnswer?: boolean;

  @IsOptional()
  @IsBoolean()
  directAnswer?: boolean;

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
