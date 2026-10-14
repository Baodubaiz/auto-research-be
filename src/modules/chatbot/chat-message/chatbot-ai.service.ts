import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatMode, ChatSender, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ChatbotAiDispatcher } from './chatbot-ai.dispatcher';
import { SendAiMessageDto } from './dto/send-ai-message.dto';

@Injectable()
export class ChatbotAiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: ChatbotAiDispatcher,
  ) {}

  async sendMessage(userId: string, sessionId: string, dto: SendAiMessageDto) {
    const session = await this.ensureOwnedSession(userId, sessionId);
    if (session.mode === ChatMode.inner_chatbot) {
      return this.executeInnerChat(userId, session, dto);
    }
    return this.executeOuterChat(userId, session, dto);
  }

  async sendOuterChatMessage(
    userId: string,
    sessionId: string,
    dto: SendAiMessageDto,
  ) {
    const session = await this.ensureOwnedSession(userId, sessionId);
    return this.executeOuterChat(userId, session, dto);
  }

  async sendInnerChatMessage(
    userId: string,
    sessionId: string,
    dto: SendAiMessageDto,
  ) {
    const session = await this.ensureOwnedSession(userId, sessionId);
    return this.executeInnerChat(userId, session, dto);
  }

  private async executeOuterChat(
    userId: string,
    session: {
      id: string;
      webSearchEnabled: boolean | null;
      language: string | null;
      model: string | null;
    },
    dto: SendAiMessageDto,
  ) {
    const chatHistory = await this.getChatHistory(session.id);
    const userMessage = await this.saveMessage(
      session.id,
      ChatSender.user,
      dto.question,
    );

    const res = await this.dispatcher.dispatch({
      userId,
      sessionId: session.id,
      eventType: 'outer_chatbot',
      errorCode: 650,
      dto,
      kafkaData: {
        question: dto.question,
        chat_history: chatHistory,
        short_answer: dto.shortAnswer ?? false,
        direct_answer: dto.directAnswer ?? false,
        use_web_search_chatbot:
          dto.useWebSearchChatbot ?? session.webSearchEnabled ?? false,
      },
    });

    const answer = this.extractAiResponse(res);
    const assistantMessage = await this.saveMessage(
      session.id,
      ChatSender.assistant,
      answer,
      res,
    );

    return {
      userMessage,
      assistantMessage,
      answer,
      ...res,
    };
  }

  private async executeInnerChat(
    userId: string,
    session: {
      id: string;
      documentId: string | null;
      webSearchEnabled: boolean | null;
      language: string | null;
      model: string | null;
    },
    dto: SendAiMessageDto,
  ) {
    if (!session.documentId) {
      throw new BadRequestException(
        'Inner chat session must be associated with a valid document',
      );
    }

    const count = await this.prisma.userUploadedDocument.count({
      where: { documentId: session.documentId, isEmbedded: true },
    });
    if (count === 0) {
      throw new BadRequestException(
        'Chưa có tài liệu nào được vector hóa cho đề tài này',
      );
    }

    const chatHistory = await this.getChatHistory(session.id);
    const userMessage = await this.saveMessage(
      session.id,
      ChatSender.user,
      dto.question,
    );

    const res = await this.dispatcher.dispatch({
      userId,
      sessionId: session.id,
      documentId: session.documentId,
      eventType: 'inner_chatbot',
      errorCode: 651,
      dto,
      kafkaData: {
        question: dto.question,
        chat_history: chatHistory,
        short_answer: dto.shortAnswer ?? false,
        direct_answer: dto.directAnswer ?? false,
        use_web_search_chatbot:
          dto.useWebSearchChatbot ?? session.webSearchEnabled ?? false,
      },
    });

    const answer = this.extractAiResponse(res);
    const assistantMessage = await this.saveMessage(
      session.id,
      ChatSender.assistant,
      answer,
      res,
    );

    return {
      userMessage,
      assistantMessage,
      answer,
      ...res,
    };
  }

  async ensureOwnedSession(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Chat session not found');
    return session;
  }

  private async getChatHistory(sessionId: string) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
    return messages.map((m) => ({
      role: m.sender === ChatSender.user ? 'user' : 'assistant',
      content: m.message,
    }));
  }

  private async saveMessage(
    sessionId: string,
    sender: ChatSender,
    content: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.chatMessage.create({
      data: {
        sessionId,
        sender,
        message: content,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  private extractAiResponse(data: Record<string, unknown>): string {
    const text =
      data.response ||
      data.answer ||
      data.message ||
      data.text ||
      data.content ||
      '';
    return typeof text === 'string' ? text : JSON.stringify(text);
  }
}
