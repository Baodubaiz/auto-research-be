import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateNestedChatMessageDto } from './dto/create-nested-chat-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';
import { ChatMessageService } from './chat-message.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatMessageRouteController {
  constructor(private readonly service: ChatMessageService) {}

  @Post('sessions/:sessionId/messages')
  create(@CurrentUser('sub') userId: string, @Param('sessionId') sessionId: string, @Body() dto: CreateNestedChatMessageDto) {
    return this.service.createForSession(userId, sessionId, dto);
  }

  @Get('sessions/:sessionId/messages')
  findAll(@CurrentUser('sub') userId: string, @Param('sessionId') sessionId: string) {
    return this.service.findAll(userId, sessionId);
  }

  @Get('messages/:id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.findOne(userId, id); }

  @Patch('messages/:id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateChatMessageDto) { return this.service.update(userId, id, dto); }

  @Delete('messages/:id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.remove(userId, id); }
}