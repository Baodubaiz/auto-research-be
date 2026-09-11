import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateEnhancementSuggestionDto } from './dto/create-enhancement-suggestion.dto';
import { UpdateEnhancementSuggestionDto } from './dto/update-enhancement-suggestion.dto';
import { EnhancementSuggestionService } from './enhancement-suggestion.service';

@Controller('enhancement-suggestions')
@UseGuards(JwtAuthGuard)
export class EnhancementSuggestionController {
  constructor(private readonly service: EnhancementSuggestionService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateEnhancementSuggestionDto) { return this.service.create(userId, dto); }

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query('sessionId') sessionId?: string) { return this.service.findAll(userId, sessionId); }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.findOne(userId, id); }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateEnhancementSuggestionDto) { return this.service.update(userId, id, dto); }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.remove(userId, id); }
}