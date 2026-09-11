import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { UserUploadedDocumentController } from './user-uploaded-document.controller';
import { UserUploadedDocumentService } from './user-uploaded-document.service';

@Module({ imports: [AuthModule], controllers: [UserUploadedDocumentController], providers: [UserUploadedDocumentService], exports: [UserUploadedDocumentService] })
export class UserUploadedDocumentModule {}