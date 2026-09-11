import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateReferenceDto } from './dto/create-reference.dto';
import { UpdateReferenceDto } from './dto/update-reference.dto';
import { ReferenceService } from './reference.service';

@Controller('references')
@UseGuards(JwtAuthGuard)
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Post()
  create(@Body() dto: CreateReferenceDto) { return this.referenceService.create(dto); }

  @Get()
  findAll() { return this.referenceService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.referenceService.findOne(id); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReferenceDto) { return this.referenceService.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.referenceService.remove(id); }
}