import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateEnhancementSuggestionDto } from './dto/create-enhancement-suggestion.dto';
import { UpdateEnhancementSuggestionDto } from './dto/update-enhancement-suggestion.dto';

@Injectable()
export class EnhancementSuggestionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateEnhancementSuggestionDto) {
    await this.ensureSession(userId, dto.sessionId);
    return this.prisma.enhancementSuggestion.create({ data: dto });
  }

  async findAll(userId: string, sessionId?: string) {
    if (sessionId) await this.ensureSession(userId, sessionId);
    return this.prisma.enhancementSuggestion.findMany({
      where: sessionId ? { sessionId } : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const suggestion = await this.prisma.enhancementSuggestion.findFirst({ where: { id, session: { document: { userId } } } });
    if (!suggestion) throw new NotFoundException('Enhancement suggestion not found');
    return suggestion;
  }

  async update(userId: string, id: string, dto: UpdateEnhancementSuggestionDto) {
    const suggestion = await this.findOne(userId, id);
    return this.prisma.enhancementSuggestion.update({ where: { id: suggestion.id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const suggestion = await this.findOne(userId, id);
    await this.prisma.enhancementSuggestion.delete({ where: { id: suggestion.id } });
    return { message: 'Enhancement suggestion deleted successfully' };
  }

  async createForSession(userId: string, sessionId: string, dto: Omit<CreateEnhancementSuggestionDto, 'sessionId'>) {
    await this.ensureSession(userId, sessionId);
    return this.prisma.enhancementSuggestion.create({ data: { ...dto, sessionId } });
  }

  private async ensureSession(userId: string, sessionId: string) {
    const session = await this.prisma.enhancementSession.findUnique({
      where: { id: sessionId, document: { userId } },
      select: { id: true },
    });
    if (!session) throw new NotFoundException('Enhancement session not found');
  }
}