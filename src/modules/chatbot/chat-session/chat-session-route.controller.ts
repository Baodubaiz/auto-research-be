import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { UpdateChatSessionDto } from './dto/update-chat-session.dto';
import { ChatSessionService } from './chat-session.service';

@Controller('chat/sessions')
@UseGuards(JwtAuthGuard)
export class ChatSessionRouteController {
  constructor(private readonly service: ChatSessionService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateChatSessionDto) { return this.service.create(userId, dto); }

  @Get()
  findAll(@CurrentUser('sub') userId: string) { return this.service.findAll(userId); }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.findOne(userId, id); }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateChatSessionDto) { return this.service.update(userId, id, dto); }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.remove(userId, id); }
}