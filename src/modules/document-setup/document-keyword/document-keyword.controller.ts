import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateDocumentKeywordDto } from './dto/create-document-keyword.dto';
import { UpdateDocumentKeywordDto } from './dto/update-document-keyword.dto';
import { DocumentKeywordService } from './document-keyword.service';

@Controller('document-keywords')
@UseGuards(JwtAuthGuard)
export class DocumentKeywordController {
  constructor(private readonly documentKeywordService: DocumentKeywordService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateDocumentKeywordDto) { return this.documentKeywordService.create(userId, dto); }

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query('documentId') documentId: string) { return this.documentKeywordService.findAll(userId, documentId); }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.documentKeywordService.findOne(userId, id); }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateDocumentKeywordDto) { return this.documentKeywordService.update(userId, id, dto); }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.documentKeywordService.remove(userId, id); }
}