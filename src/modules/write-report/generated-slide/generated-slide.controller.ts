import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateGeneratedSlideDto } from './dto/create-generated-slide.dto';
import { UpdateGeneratedSlideDto } from './dto/update-generated-slide.dto';
import { GeneratedSlideService } from './generated-slide.service';

@Controller('generated-slides')
@UseGuards(JwtAuthGuard)
export class GeneratedSlideController {
  constructor(private readonly service: GeneratedSlideService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateGeneratedSlideDto) { return this.service.create(userId, dto); }

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query('documentId') documentId?: string) { return this.service.findAll(userId, documentId); }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.findOne(userId, id); }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateGeneratedSlideDto) { return this.service.update(userId, id, dto); }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.remove(userId, id); }
}