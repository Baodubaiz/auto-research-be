import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';
import { DatasetService } from './dataset.service';

@Controller('datasets')
@UseGuards(JwtAuthGuard)
export class DatasetController {
  constructor(private readonly datasetService: DatasetService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateDatasetDto) { return this.datasetService.create(userId, dto); }

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query('documentId') documentId?: string) { return this.datasetService.findAll(userId, documentId); }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.datasetService.findOne(userId, id); }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateDatasetDto) { return this.datasetService.update(userId, id, dto); }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.datasetService.remove(userId, id); }

}