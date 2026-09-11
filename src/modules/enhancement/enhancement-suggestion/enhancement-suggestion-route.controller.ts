import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateNestedEnhancementSuggestionDto } from './dto/create-nested-enhancement-suggestion.dto';
import { UpdateEnhancementSuggestionDto } from './dto/update-enhancement-suggestion.dto';
import { EnhancementSuggestionService } from './enhancement-suggestion.service';

@Controller('enhancement')
@UseGuards(JwtAuthGuard)
export class EnhancementSuggestionRouteController {
  constructor(private readonly service: EnhancementSuggestionService) {}

  @Post('sessions/:sessionId/suggestions')
  create(@CurrentUser('sub') userId: string, @Param('sessionId') sessionId: string, @Body() dto: CreateNestedEnhancementSuggestionDto) {
    return this.service.createForSession(userId, sessionId, dto);
  }

  @Get('sessions/:sessionId/suggestions')
  findAll(@CurrentUser('sub') userId: string, @Param('sessionId') sessionId: string) { return this.service.findAll(userId, sessionId); }

  @Get('suggestions/:id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.findOne(userId, id); }

  @Patch('suggestions/:id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateEnhancementSuggestionDto) { return this.service.update(userId, id, dto); }

  @Delete('suggestions/:id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.remove(userId, id); }
}