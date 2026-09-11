import { ChatSender, Prisma } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateNestedChatMessageDto {
  @IsEnum(ChatSender)
  sender!: ChatSender;

  @IsString()
  message!: string;

  @IsOptional()
  metadata?: Prisma.InputJsonValue;
}