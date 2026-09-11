import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateUserUploadedDocumentDto } from './dto/create-user-uploaded-document.dto';
import { UpdateUserUploadedDocumentDto } from './dto/update-user-uploaded-document.dto';

@Injectable()
export class UserUploadedDocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateUserUploadedDocumentDto) {
    await this.ensureOwnedDocument(userId, dto.documentId);
    return this.prisma.userUploadedDocument.create({ data: dto });
  }

  async findAll(userId: string, documentId: string) {
    if (!documentId) throw new BadRequestException('documentId is required');
    await this.ensureOwnedDocument(userId, documentId);
    return this.prisma.userUploadedDocument.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const uploadedDocument = await this.prisma.userUploadedDocument.findFirst({ where: { id, document: { userId } } });
    if (!uploadedDocument) throw new NotFoundException('Uploaded document not found');
    return uploadedDocument;
  }

  async update(userId: string, id: string, dto: UpdateUserUploadedDocumentDto) {
    const uploadedDocument = await this.findOne(userId, id);
    return this.prisma.userUploadedDocument.update({ where: { id: uploadedDocument.id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const uploadedDocument = await this.findOne(userId, id);
    await this.prisma.userUploadedDocument.delete({ where: { id: uploadedDocument.id } });
    return { message: 'Uploaded document deleted successfully' };
  }

  private async ensureOwnedDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId, userId }, select: { id: true } });
    if (!document) throw new NotFoundException('Document not found');
  }
}