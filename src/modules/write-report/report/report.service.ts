import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReportDto) {
    await this.ensureDocument(userId, dto.documentId);
    try {
      return await this.prisma.report.create({ data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A report already exists for this document');
      }
      throw error;
    }
  }

  findAll(userId: string) {
    return this.prisma.report.findMany({ where: { document: { userId } }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(userId: string, id: string) {
    const report = await this.prisma.report.findFirst({ where: { id, document: { userId } } });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async update(userId: string, id: string, dto: UpdateReportDto) {
    const report = await this.findOne(userId, id);
    return this.prisma.report.update({ where: { id: report.id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const report = await this.findOne(userId, id);
    await this.prisma.report.delete({ where: { id: report.id } });
    return { message: 'Report deleted successfully' };
  }

  async findByDocument(userId: string, documentId: string) {
    await this.ensureDocument(userId, documentId);
    const report = await this.prisma.report.findUnique({ where: { documentId } });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  private async ensureDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId, userId }, select: { id: true } });
    if (!document) throw new NotFoundException('Document not found');
  }
}