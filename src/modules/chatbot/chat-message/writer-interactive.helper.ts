import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChatSender, JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  getAiErrorMessage,
  getAiErrorName,
} from '../../../common/constants/ai-error-codes';

export class WriterInteractiveHelper {
  static async ensureOwnedSession(
    prisma: PrismaService,
    userId: string,
    sessionId: string,
  ) {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Chat session not found');
    return session;
  }

  static async getChatHistory(prisma: PrismaService, sessionId: string) {
    const msgs = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
    return msgs.map((m) => ({
      role: m.sender === ChatSender.user ? 'user' : 'assistant',
      content: m.message,
    }));
  }

  static async saveMessage(
    prisma: PrismaService,
    sessionId: string,
    sender: ChatSender,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    return prisma.chatMessage.create({
      data: {
        sessionId,
        sender,
        message,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  static extractText(data: Record<string, unknown>): string {
    const t =
      data.response ||
      data.answer ||
      data.message ||
      data.content ||
      data.ai_message ||
      '';
    return typeof t === 'string' ? t : JSON.stringify(t);
  }

  static extractErrorMsg(err: unknown, defaultCode: number): string {
    if (err && typeof err === 'object') {
      const o = err as Record<string, unknown>;
      if (typeof o.message === 'string') return o.message;
      if (typeof o.error === 'string') return o.error;
    }
    return getAiErrorMessage(defaultCode);
  }

  static async failJob(
    prisma: PrismaService,
    jobId: string,
    code: number,
    msg: string,
  ): Promise<never> {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.error,
        errorCode: String(code),
        errorMessage: msg,
      },
    });
    throw new BadRequestException({
      statusCode: 400,
      errorCode: code,
      error: getAiErrorName(code),
      message: msg,
    });
  }
}
