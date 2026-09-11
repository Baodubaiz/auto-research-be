import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateDocumentKeywordDto } from './dto/create-document-keyword.dto';
import { UpdateDocumentKeywordDto } from './dto/update-document-keyword.dto';

@Injectable()
export class DocumentKeywordService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateDocumentKeywordDto) {
    await this.ensureOwnedDocument(userId, dto.documentId);
    return this.prisma.documentKeyword.create({ data: dto });
  }

  async findAll(userId: string, documentId: string) {
    if (!documentId) throw new BadRequestException('documentId is required');
    await this.ensureOwnedDocument(userId, documentId);
    return this.prisma.documentKeyword.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const keyword = await this.prisma.documentKeyword.findFirst({ where: { id, document: { userId } } });
    if (!keyword) throw new NotFoundException('Document keyword not found');
    return keyword;
  }

  async update(userId: string, id: string, dto: UpdateDocumentKeywordDto) {
    const keyword = await this.findOne(userId, id);
    return this.prisma.documentKeyword.update({ where: { id: keyword.id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const keyword = await this.findOne(userId, id);
    await this.prisma.documentKeyword.delete({ where: { id: keyword.id } });
    return { message: 'Document keyword deleted successfully' };
  }

  private async ensureOwnedDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId, userId }, select: { id: true } });
    if (!document) throw new NotFoundException('Document not found');
  }
}