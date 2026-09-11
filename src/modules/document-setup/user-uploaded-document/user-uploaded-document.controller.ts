import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateUserUploadedDocumentDto } from './dto/create-user-uploaded-document.dto';
import { UpdateUserUploadedDocumentDto } from './dto/update-user-uploaded-document.dto';
import { UserUploadedDocumentService } from './user-uploaded-document.service';

@Controller('uploaded-documents')
@UseGuards(JwtAuthGuard)
export class UserUploadedDocumentController {
  constructor(private readonly service: UserUploadedDocumentService) {}

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateUserUploadedDocumentDto) { return this.service.create(userId, dto); }

  @Get()
  findAll(@CurrentUser('sub') userId: string, @Query('documentId') documentId: string) { return this.service.findAll(userId, documentId); }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.findOne(userId, id); }

  @Patch(':id')
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateUserUploadedDocumentDto) { return this.service.update(userId, id, dto); }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) { return this.service.remove(userId, id); }
}