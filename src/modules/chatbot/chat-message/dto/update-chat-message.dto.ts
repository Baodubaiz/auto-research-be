import { ChatSender, Prisma } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateChatMessageDto {
  @IsOptional()
  @IsEnum(ChatSender)
  sender?: ChatSender;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  metadata?: Prisma.InputJsonValue;
}