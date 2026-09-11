import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateProposedMethodDto } from './dto/create-proposed-method.dto';
import { UpdateProposedMethodDto } from './dto/update-proposed-method.dto';

@Injectable()
export class ProposedMethodService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProposedMethodDto) {
    await this.ensureDocument(userId, dto.documentId);
    return this.prisma.proposedMethod.create({ data: dto });
  }

  async findAll(userId: string, documentId?: string) {
    if (documentId) await this.ensureDocument(userId, documentId);
    return this.prisma.proposedMethod.findMany({
      where: documentId ? { documentId } : { document: { userId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const method = await this.prisma.proposedMethod.findFirst({ where: { id, document: { userId } } });
    if (!method) throw new NotFoundException('Proposed method not found');
    return method;
  }

  async update(userId: string, id: string, dto: UpdateProposedMethodDto) {
    const method = await this.findOne(userId, id);
    return this.prisma.proposedMethod.update({ where: { id: method.id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const method = await this.findOne(userId, id);
    await this.prisma.proposedMethod.delete({ where: { id: method.id } });
    return { message: 'Proposed method deleted successfully' };
  }

  private async ensureDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId, userId }, select: { id: true } });
    if (!document) throw new NotFoundException('Document not found');
  }
}