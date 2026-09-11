import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateEnhancementSessionDto } from './dto/create-enhancement-session.dto';
import { UpdateEnhancementSessionDto } from './dto/update-enhancement-session.dto';
import { EnhancementSessionService } from './enhancement-session.service';

@Controller('enhancement/sessions')
@UseGuards(JwtAuthGuard)
export class EnhancementSessionRouteController {
  constructor(private readonly service: EnhancementSessionService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateEnhancementSessionDto) { return this.service.create(userId, dto); }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.findOne(userId, id); }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateEnhancementSessionDto) { return this.service.update(userId, id, dto); }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.remove(userId, id); }
}