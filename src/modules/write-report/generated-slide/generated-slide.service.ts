import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateGeneratedSlideDto } from './dto/create-generated-slide.dto';
import { UpdateGeneratedSlideDto } from './dto/update-generated-slide.dto';

@Injectable()
export class GeneratedSlideService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateGeneratedSlideDto) {
    await this.ensureDocument(userId, dto.documentId);
    return this.prisma.generatedSlide.create({ data: dto });
  }

  async findAll(userId: string, documentId?: string) {
    if (documentId) await this.ensureDocument(userId, documentId);
    return this.prisma.generatedSlide.findMany({
      where: documentId ? { documentId } : { document: { userId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const slide = await this.prisma.generatedSlide.findFirst({ where: { id, document: { userId } } });
    if (!slide) throw new NotFoundException('Generated slide not found');
    return slide;
  }

  async update(userId: string, id: string, dto: UpdateGeneratedSlideDto) {
    const slide = await this.findOne(userId, id);
    return this.prisma.generatedSlide.update({ where: { id: slide.id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const slide = await this.findOne(userId, id);
    await this.prisma.generatedSlide.delete({ where: { id: slide.id } });
    return { message: 'Generated slide deleted successfully' };
  }

  private async ensureDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId, userId }, select: { id: true } });
    if (!document) throw new NotFoundException('Document not found');
  }
}