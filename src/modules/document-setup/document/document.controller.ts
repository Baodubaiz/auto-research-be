import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AttachReferenceDto } from './dto/attach-reference.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentService } from './document.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateDocumentDto) { return this.documentService.create(userId, dto); }

  @Get()
  findAll(@CurrentUser('sub') userId: string) { return this.documentService.findAll(userId); }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.documentService.findOne(userId, id); }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateDocumentDto) { return this.documentService.update(userId, id, dto); }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.documentService.remove(userId, id); }

  @Get(':id/references')
  listReferences(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.documentService.listReferences(userId, id);
  }

  @Post(':id/references')
  attachReference(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: AttachReferenceDto) {
    return this.documentService.attachReference(userId, id, dto.referenceId);
  }

  @Delete(':id/references/:referenceId')
  detachReference(@CurrentUser('sub') userId: string, @Param('id') id: string, @Param('referenceId') referenceId: string) {
    return this.documentService.detachReference(userId, id, referenceId);
  }
}