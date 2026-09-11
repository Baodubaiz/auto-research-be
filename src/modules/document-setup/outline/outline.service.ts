import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateOutlineDto } from './dto/create-outline.dto';
import { UpdateOutlineDto } from './dto/update-outline.dto';

@Injectable()
export class OutlineService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOutlineDto) {
    await this.ensureOwnedDocument(userId, dto.documentId);
    try {
      return await this.prisma.outline.create({ data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An outline already exists for this document');
      }
      throw error;
    }
  }

  async findByDocument(userId: string, documentId: string) {
    if (!documentId) throw new BadRequestException('documentId is required');
    await this.ensureOwnedDocument(userId, documentId);
    const outline = await this.prisma.outline.findUnique({ where: { documentId } });
    if (!outline) throw new NotFoundException('Outline not found');
    return outline;
  }

  async update(userId: string, id: string, dto: UpdateOutlineDto) {
    const outline = await this.findOne(userId, id);
    return this.prisma.outline.update({ where: { id: outline.id }, data: dto });
  }

  async findOne(userId: string, id: string) {
    const outline = await this.prisma.outline.findFirst({ where: { id, document: { userId } } });
    if (!outline) throw new NotFoundException('Outline not found');
    return outline;
  }

  async remove(userId: string, id: string) {
    const outline = await this.findOne(userId, id);
    await this.prisma.outline.delete({ where: { id: outline.id } });
    return { message: 'Outline deleted successfully' };
  }

  private async ensureOwnedDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId, userId }, select: { id: true } });
    if (!document) throw new NotFoundException('Document not found');
  }
}