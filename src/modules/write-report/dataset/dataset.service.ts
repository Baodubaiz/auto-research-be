import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';

@Injectable()
export class DatasetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateDatasetDto) {
    await this.ensureDocument(userId, dto.documentId);
    return this.prisma.dataset.create({ data: dto });
  }

  async findAll(userId: string, documentId?: string) {
    if (documentId) await this.ensureDocument(userId, documentId);
    return this.prisma.dataset.findMany({
      where: documentId ? { documentId } : { document: { userId } },
      include: { variables: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const dataset = await this.prisma.dataset.findFirst({ where: { id, document: { userId } }, include: { variables: true } });
    if (!dataset) throw new NotFoundException('Dataset not found');
    return dataset;
  }

  async update(userId: string, id: string, dto: UpdateDatasetDto) {
    const dataset = await this.findOne(userId, id);
    return this.prisma.dataset.update({ where: { id: dataset.id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const dataset = await this.findOne(userId, id);
    await this.prisma.dataset.delete({ where: { id: dataset.id } });
    return { message: 'Dataset deleted successfully' };
  }

  private async ensureDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId, userId }, select: { id: true } });
    if (!document) throw new NotFoundException('Document not found');
  }
}