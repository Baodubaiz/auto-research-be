import { Module } from '@nestjs/common';
import { DocumentModule } from './document/document.module';
import { DocumentKeywordModule } from './document-keyword/document-keyword.module';
import { OutlineModule } from './outline/outline.module';
import { ProposalModule } from './proposal/proposal.module';
import { ReferenceModule } from './reference/reference.module';
import { UserUploadedDocumentModule } from './user-uploaded-document/user-uploaded-document.module';

@Module({
  imports: [
    DocumentModule,
    ProposalModule,
    DocumentKeywordModule,
    ReferenceModule,
    UserUploadedDocumentModule,
    OutlineModule,
  ],
})
export class DocumentSetupModule {}