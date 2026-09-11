import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';
import { ChatMessageService } from './chat-message.service';

@Controller('chat-messages')
@UseGuards(JwtAuthGuard)
export class ChatMessageController {
  constructor(private readonly chatMessageService: ChatMessageService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateChatMessageDto) { return this.chatMessageService.create(userId, dto); }

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query('sessionId') sessionId?: string) { return this.chatMessageService.findAll(userId, sessionId); }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.chatMessageService.findOne(userId, id); }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateChatMessageDto) { return this.chatMessageService.update(userId, id, dto); }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.chatMessageService.remove(userId, id); }
}