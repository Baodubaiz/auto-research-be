import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DocStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateDocumentDto) {
  await this.ensureUser(userId);

  return this.prisma.document.create({
    data: {
      userId,
      title: dto.title,
      field: dto.field,
      documentType: dto.documentType,
      language: dto.language,
      domains: dto.domains,
      subdomains: dto.subdomains,
      numberOfDomains: dto.numberOfDomains,
      numberOfSubdomains: dto.numberOfSubdomains,
      webSearchEnabled: dto.webSearchEnabled,
      researchType: dto.researchType,
      status: dto.status,
    },
  });
}

  findAll(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id, userId },
      include: {
        proposals: true,
        keywords: true,
        outline: true,
        userUploadedDocuments: true,
        documentReferences: { include: { reference: true } },
      },
    });

    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async update(userId: string, id: string, dto: UpdateDocumentDto) {
    await this.ensureOwned(userId, id);
    return this.prisma.document.update({
      where: { id, userId },
      data: { ...dto, status: dto.status as DocStatus | undefined },
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    await this.prisma.document.delete({ where: { id, userId } });
    return { message: 'Document deleted successfully' };
  }

  async listReferences(userId: string, documentId: string) {
    await this.ensureOwned(userId, documentId);
    return this.prisma.documentReference.findMany({
      where: { documentId },
      include: { reference: true },
    });
  }

  async attachReference(userId: string, documentId: string, referenceId: string) {
    await this.ensureOwned(userId, documentId);
    const reference = await this.prisma.reference.findUnique({ where: { id: referenceId } });
    if (!reference) throw new NotFoundException('Reference not found');

    try {
      return await this.prisma.documentReference.create({ data: { documentId, referenceId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Reference is already attached to this document');
      }
      throw error;
    }
  }

  async detachReference(userId: string, documentId: string, referenceId: string) {
    await this.ensureOwned(userId, documentId);
    try {
      await this.prisma.documentReference.delete({
        where: { documentId_referenceId: { documentId, referenceId } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Document reference not found');
      }
      throw error;
    }
    return { message: 'Reference detached successfully' };
  }

  private async ensureOwned(userId: string, id: string) {
    const document = await this.prisma.document.findUnique({ where: { id, userId }, select: { id: true } });
    if (!document) throw new NotFoundException('Document not found');
  }

  private async ensureUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');
  }
}