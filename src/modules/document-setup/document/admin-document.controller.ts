import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminDocumentsAiService } from './admin-documents-ai.service';
import { AdminDocumentsAuditInterceptor } from './admin-documents-audit.interceptor';
import {
  AdminSampleDocumentDto,
  AdminUserGuideDto,
  GetJournalsQueryDto,
} from './dto/admin-documents.dto';

@Controller('admin/documents')
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(AdminDocumentsAuditInterceptor)
export class AdminDocumentController {
  constructor(private readonly adminAiService: AdminDocumentsAiService) {}

  @Post('sample')
  uploadSampleDocument(
    @CurrentUser('sub') userId: string,
    @Body() dto: AdminSampleDocumentDto,
  ) {
    return this.adminAiService.uploadSampleDocument(userId, dto);
  }

  @Post('user-guide')
  uploadUserGuide(
    @CurrentUser('sub') userId: string,
    @Body() dto: AdminUserGuideDto,
  ) {
    return this.adminAiService.uploadUserGuide(userId, dto);
  }

  @Get('journals')
  getJournals(
    @CurrentUser('sub') userId: string,
    @Query() query: GetJournalsQueryDto,
  ) {
    return this.adminAiService.getJournals(userId, query);
  }
}
