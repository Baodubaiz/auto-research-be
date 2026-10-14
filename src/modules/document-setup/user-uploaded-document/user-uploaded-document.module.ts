import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { UserUploadedDocumentController } from './user-uploaded-document.controller';
import { UserUploadedDocumentService } from './user-uploaded-document.service';
import { UserUploadedDocumentAiService } from './user-uploaded-document-ai.service';
import { UserDocAiDispatcher } from './user-doc-ai.dispatcher';

@Module({
  imports: [AuthModule],
  controllers: [UserUploadedDocumentController],
  providers: [
    UserUploadedDocumentService,
    UserUploadedDocumentAiService,
    UserDocAiDispatcher,
  ],
  exports: [UserUploadedDocumentService, UserUploadedDocumentAiService],
})
export class UserUploadedDocumentModule {}
