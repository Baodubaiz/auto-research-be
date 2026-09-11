import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateNestedDatasetVariableDto } from './dto/create-nested-dataset-variable.dto';
import { DatasetVariableService } from './dataset-variable.service';

@Controller('datasets')
@UseGuards(JwtAuthGuard)
export class DatasetVariableDocumentController {
  constructor(private readonly service: DatasetVariableService) {}

  @Post(':datasetId/variables')
  create(@CurrentUser('sub') userId: string, @Param('datasetId') datasetId: string, @Body() dto: CreateNestedDatasetVariableDto) {
    return this.service.create(userId, { ...dto, datasetId });
  }

  @Get(':datasetId/variables')
  findAll(@CurrentUser('sub') userId: string, @Param('datasetId') datasetId: string) {
    return this.service.findAll(userId, datasetId);
  }
}