import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth/auth.module';
import { DocumentKeywordController } from './document-keyword.controller';
import { DocumentKeywordService } from './document-keyword.service';

@Module({ imports: [AuthModule], controllers: [DocumentKeywordController], providers: [DocumentKeywordService], exports: [DocumentKeywordService] })
export class DocumentKeywordModule {}