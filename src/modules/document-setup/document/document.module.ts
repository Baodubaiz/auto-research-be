import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { AdminDocumentController } from './admin-document.controller';
import { AdminDocumentsAiService } from './admin-documents-ai.service';

@Module({
  imports: [AuthModule],
  controllers: [DocumentController, AdminDocumentController],
  providers: [DocumentService, AdminDocumentsAiService, AdminGuard],
  exports: [DocumentService, AdminDocumentsAiService],
})
export class DocumentModule {}
