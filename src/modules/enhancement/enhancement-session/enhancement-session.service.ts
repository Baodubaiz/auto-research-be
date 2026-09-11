import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateEnhancementSessionDto } from './dto/create-enhancement-session.dto';
import { UpdateEnhancementSessionDto } from './dto/update-enhancement-session.dto';

@Injectable()
export class EnhancementSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateEnhancementSessionDto) {
    await this.ensureDocument(userId, dto.documentId);
    return this.prisma.enhancementSession.create({ data: dto });
  }

  async findAll(userId: string, documentId?: string) {
    if (documentId) await this.ensureDocument(userId, documentId);
    return this.prisma.enhancementSession.findMany({
      where: documentId ? { documentId } : { document: { userId } },
      include: { suggestions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const session = await this.prisma.enhancementSession.findUnique({
      where: { id, document: { userId } },
      include: { suggestions: true },
    });
    if (!session) throw new NotFoundException('Enhancement session not found');
    return session;
  }

  async update(userId: string, id: string, dto: UpdateEnhancementSessionDto) {
    const session = await this.findOne(userId, id);
    return this.prisma.enhancementSession.update({ where: { id: session.id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const session = await this.findOne(userId, id);
    await this.prisma.enhancementSession.delete({ where: { id: session.id } });
    return { message: 'Enhancement session deleted successfully' };
  }

  private async ensureDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId, userId },
      select: { id: true },
    });
    if (!document) throw new NotFoundException('Document not found');
  }
}