import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { UserUploadedDocumentController } from './user-uploaded-document.controller';
import { UserUploadedDocumentService } from './user-uploaded-document.service';
import { UserUploadedDocumentAiService } from './user-uploaded-document-ai.service';
import { UserDocAiDispatcher } from './user-doc-ai.dispatcher';

import { MinioStorageService } from '../../../common/services/minio-storage.service';

@Module({
  imports: [AuthModule],
  controllers: [UserUploadedDocumentController],
  providers: [
    UserUploadedDocumentService,
    UserUploadedDocumentAiService,
    UserDocAiDispatcher,
    MinioStorageService,
  ],
  exports: [
    UserUploadedDocumentService,
    UserUploadedDocumentAiService,
    MinioStorageService,
  ],
})
export class UserUploadedDocumentModule {}
