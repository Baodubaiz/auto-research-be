import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';

@Injectable()
export class ChatMessageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateChatMessageDto) {
    await this.ensureSession(userId, dto.sessionId);
    return this.prisma.chatMessage.create({ data: dto });
  }

  async findAll(userId: string, sessionId?: string) {
    if (sessionId) await this.ensureSession(userId, sessionId);
    return this.prisma.chatMessage.findMany({
      where: sessionId ? { sessionId } : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const message = await this.prisma.chatMessage.findFirst({ where: { id, session: { userId } } });
    if (!message) throw new NotFoundException('Chat message not found');
    return message;
  }

  async update(userId: string, id: string, dto: UpdateChatMessageDto) {
    const message = await this.findOne(userId, id);
    return this.prisma.chatMessage.update({ where: { id: message.id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const message = await this.findOne(userId, id);
    await this.prisma.chatMessage.delete({ where: { id: message.id } });
    return { message: 'Chat message deleted successfully' };
  }

  async createForSession(userId: string, sessionId: string, dto: Omit<CreateChatMessageDto, 'sessionId'>) {
    await this.ensureSession(userId, sessionId);
    return this.prisma.chatMessage.create({ data: { ...dto, sessionId } });
  }

  private async ensureSession(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({ where: { id: sessionId, userId }, select: { id: true } });
    if (!session) throw new NotFoundException('Chat session not found');
  }
}