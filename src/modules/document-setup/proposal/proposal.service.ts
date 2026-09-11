import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';

@Injectable()
export class ProposalService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProposalDto) {
    await this.ensureOwnedDocument(userId, dto.documentId);
    return this.prisma.proposal.create({ data: dto });
  }

  async findAll(userId: string, documentId: string) {
    if (!documentId) throw new BadRequestException('documentId is required');
    await this.ensureOwnedDocument(userId, documentId);
    return this.prisma.proposal.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const proposal = await this.prisma.proposal.findFirst({ where: { id, document: { userId } } });
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }

  async update(userId: string, id: string, dto: UpdateProposalDto) {
    const proposal = await this.findOne(userId, id);
    return this.prisma.proposal.update({ where: { id: proposal.id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const proposal = await this.findOne(userId, id);
    await this.prisma.proposal.delete({ where: { id: proposal.id } });
    return { message: 'Proposal deleted successfully' };
  }

  async select(userId: string, id: string) {
    const proposal = await this.findOne(userId, id);
    await this.prisma.$transaction([
      this.prisma.proposal.updateMany({ where: { documentId: proposal.documentId }, data: { isSelected: false } }),
      this.prisma.proposal.update({ where: { id: proposal.id }, data: { isSelected: true } }),
    ]);
    return this.findOne(userId, id);
  }

  private async ensureOwnedDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId, userId }, select: { id: true } });
    if (!document) throw new NotFoundException('Document not found');
  }
}