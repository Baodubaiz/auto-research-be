import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateDatasetVariableDto } from './dto/create-dataset-variable.dto';
import { UpdateDatasetVariableDto } from './dto/update-dataset-variable.dto';
import { DatasetVariableService } from './dataset-variable.service';

@Controller('dataset-variables')
@UseGuards(JwtAuthGuard)
export class DatasetVariableController {
  constructor(private readonly service: DatasetVariableService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateDatasetVariableDto) { return this.service.create(userId, dto); }

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query('datasetId') datasetId?: string) { return this.service.findAll(userId, datasetId); }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.findOne(userId, id); }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateDatasetVariableDto) { return this.service.update(userId, id, dto); }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.remove(userId, id); }
}