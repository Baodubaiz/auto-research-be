import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FileProcessingStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { UserDocAiDispatcher } from './user-doc-ai.dispatcher';
import {
  ProcessUploadedDocDto,
  SearchUploadedDocsDto,
  TriggerEmbedDocDto,
  TriggerParseDocDto,
} from './dto/user-doc-kafka.dto';

@Injectable()
export class UserUploadedDocumentAiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: UserDocAiDispatcher,
  ) {}

  async processDocument(
    userId: string,
    fileId: string,
    dto: ProcessUploadedDocDto = {},
  ) {
    const file = await this.ensureOwnedFile(userId, fileId);
    await this.updateStatus(file.id, FileProcessingStatus.processing);

    // Bước 1: Bóc tách tài liệu (user_documents - lỗi 620)
    await this.dispatcher.dispatch({
      userId,
      documentId: file.documentId,
      sessionId: dto.sessionId,
      eventType: 'user_documents',
      errorCode: 620,
      dto,
      kafkaData: {
        file_id: file.id,
        file_url: dto.fileUrl || file.fileName,
      },
      onError: async () => {
        await this.updateStatus(file.id, FileProcessingStatus.error);
      },
    });

    // Bước 2: Vector hóa tài liệu (embed_user_documents - lỗi 621)
    const embedResult = await this.dispatcher.dispatch({
      userId,
      documentId: file.documentId,
      sessionId: dto.sessionId,
      eventType: 'embed_user_documents',
      errorCode: 621,
      dto,
      kafkaData: {
        file_id: file.id,
        document_id: file.documentId,
      },
      onError: async () => {
        await this.updateStatus(file.id, FileProcessingStatus.error);
      },
      onSuccess: async () => {
        await this.prisma.userUploadedDocument.update({
          where: { id: file.id },
          data: {
            processingStatus: FileProcessingStatus.embedded,
            isEmbedded: true,
          },
        });
      },
    });

    return {
      fileId: file.id,
      documentId: file.documentId,
      status: FileProcessingStatus.embedded,
      isEmbedded: true,
      ...embedResult,
    };
  }

  async parseDocument(
    userId: string,
    fileId: string,
    dto: TriggerParseDocDto = {},
  ) {
    const file = await this.ensureOwnedFile(userId, fileId);
    await this.updateStatus(file.id, FileProcessingStatus.processing);

    return this.dispatcher.dispatch({
      userId,
      documentId: file.documentId,
      sessionId: dto.sessionId,
      eventType: 'user_documents',
      errorCode: 620,
      dto,
      kafkaData: {
        file_id: file.id,
        file_url: dto.fileUrl || file.fileName,
      },
      onError: async () => {
        await this.updateStatus(file.id, FileProcessingStatus.error);
      },
    });
  }

  async embedDocument(
    userId: string,
    fileId: string,
    dto: TriggerEmbedDocDto = {},
  ) {
    const file = await this.ensureOwnedFile(userId, fileId);
    await this.updateStatus(file.id, FileProcessingStatus.processing);

    return this.dispatcher.dispatch({
      userId,
      documentId: file.documentId,
      sessionId: dto.sessionId,
      eventType: 'embed_user_documents',
      errorCode: 621,
      dto,
      kafkaData: {
        file_id: file.id,
        document_id: file.documentId,
      },
      onError: async () => {
        await this.updateStatus(file.id, FileProcessingStatus.error);
      },
      onSuccess: async () => {
        await this.prisma.userUploadedDocument.update({
          where: { id: file.id },
          data: {
            processingStatus: FileProcessingStatus.embedded,
            isEmbedded: true,
          },
        });
      },
    });
  }

  async searchUploadedDocuments(userId: string, dto: SearchUploadedDocsDto) {
    await this.ensureOwnedDocument(userId, dto.documentId);
    const count = await this.prisma.userUploadedDocument.count({
      where: { documentId: dto.documentId, isEmbedded: true },
    });
    if (count === 0) {
      throw new BadRequestException(
        'Chưa có tài liệu nào được vector hóa cho đề tài này',
      );
    }

    return this.dispatcher.dispatch({
      userId,
      documentId: dto.documentId,
      sessionId: dto.sessionId,
      eventType: 'search_user_documents',
      errorCode: 625,
      dto,
      kafkaData: {
        document_id: dto.documentId,
        query: dto.query,
        top_k: dto.topK || 5,
      },
    });
  }

  async deleteDocumentVectors(userId: string, fileId: string) {
    const file = await this.ensureOwnedFile(userId, fileId);

    const result = await this.dispatcher.dispatch({
      userId,
      documentId: file.documentId,
      eventType: 'delete_documents',
      errorCode: 622,
      dto: {},
      kafkaData: {
        file_id: file.id,
        document_id: file.documentId,
      },
      onSuccess: async () => {
        await this.prisma.userUploadedDocument.delete({
          where: { id: file.id },
        });
      },
    });

    return {
      success: true,
      message: 'Tài liệu và vector embedding đã được xóa thành công',
      ...result,
    };
  }

  async ensureOwnedFile(userId: string, id: string) {
    const file = await this.prisma.userUploadedDocument.findFirst({
      where: { id, document: { userId } },
    });
    if (!file) throw new NotFoundException('Uploaded document not found');
    return file;
  }

  async ensureOwnedDocument(userId: string, documentId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  private async updateStatus(id: string, status: FileProcessingStatus) {
    await this.prisma.userUploadedDocument.update({
      where: { id },
      data: { processingStatus: status },
    });
  }
}
