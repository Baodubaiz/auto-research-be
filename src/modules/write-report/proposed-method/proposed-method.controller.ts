import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateProposedMethodDto } from './dto/create-proposed-method.dto';
import { UpdateProposedMethodDto } from './dto/update-proposed-method.dto';
import { ProposedMethodService } from './proposed-method.service';

@Controller('proposed-methods')
@UseGuards(JwtAuthGuard)
export class ProposedMethodController {
  constructor(private readonly service: ProposedMethodService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateProposedMethodDto) { return this.service.create(userId, dto); }

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query('documentId') documentId?: string) { return this.service.findAll(userId, documentId); }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.findOne(userId, id); }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateProposedMethodDto) { return this.service.update(userId, id, dto); }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.remove(userId, id); }
}