import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateUserUploadedDocumentDto } from './dto/create-user-uploaded-document.dto';
import { UpdateUserUploadedDocumentDto } from './dto/update-user-uploaded-document.dto';
import {
  ProcessUploadedDocDto,
  SearchUploadedDocsDto,
  TriggerEmbedDocDto,
  TriggerParseDocDto,
} from './dto/user-doc-kafka.dto';
import { UserUploadedDocumentService } from './user-uploaded-document.service';
import { UserUploadedDocumentAiService } from './user-uploaded-document-ai.service';

@Controller('uploaded-documents')
@UseGuards(JwtAuthGuard)
export class UserUploadedDocumentController {
  constructor(
    private readonly service: UserUploadedDocumentService,
    private readonly aiService: UserUploadedDocumentAiService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadPdf(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentId') documentId?: string,
  ) {
    return this.service.uploadPdf(userId, file, documentId);
  }

  @Post(':id/process')
  processDocument(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: ProcessUploadedDocDto,
  ) {
    return this.aiService.processDocument(userId, id, dto);
  }

  @Post(':id/parse')
  parseDocument(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: TriggerParseDocDto,
  ) {
    return this.aiService.parseDocument(userId, id, dto);
  }

  @Post(':id/embed')
  embedDocument(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: TriggerEmbedDocDto,
  ) {
    return this.aiService.embedDocument(userId, id, dto);
  }

  @Post('search')
  searchDocuments(
    @CurrentUser('sub') userId: string,
    @Body() dto: SearchUploadedDocsDto,
  ) {
    return this.aiService.searchUploadedDocuments(userId, dto);
  }

  @Post()
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateUserUploadedDocumentDto,
  ) {
    return this.service.create(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('sub') userId: string,
    @Query('documentId') documentId: string,
  ) {
    return this.service.findAll(userId, documentId);
  }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserUploadedDocumentDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.aiService.deleteDocumentVectors(userId, id);
  }
}
