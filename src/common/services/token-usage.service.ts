import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  RecordTokenUsageDto,
  UserTokenUsageSummary,
  DocumentTokenUsageSummary,
} from '../dto/record-token-usage.dto';

@Injectable()
export class TokenUsageService {
  private readonly logger = new Logger(TokenUsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lưu thông tin tiêu thụ token vào DB.
   * Xử lý lỗi an toàn để không làm gián đoạn response chính.
   */
  async recordUsage(params: RecordTokenUsageDto): Promise<void> {
    if (!params.userId) {
      return;
    }

    const inputTokens = Math.max(0, Number(params.inputTokens) || 0);
    const outputTokens = Math.max(0, Number(params.outputTokens) || 0);
    const embedTokens = Math.max(0, Number(params.embedTokens) || 0);
    const webSearchCall = Math.max(0, Number(params.webSearchCall) || 0);

    // Bỏ qua nếu hoàn toàn không có dữ liệu token hoặc api call
    if (
      inputTokens === 0 &&
      outputTokens === 0 &&
      embedTokens === 0 &&
      webSearchCall === 0
    ) {
      return;
    }

    try {
      await this.prisma.tokenUsage.create({
        data: {
          userId: params.userId,
          documentId: params.documentId || null,
          convId: params.convId || null,
          sessionId: params.sessionId || null,
          eventType: params.eventType || 'unknown',
          modelId: params.modelId || null,
          inputTokens,
          outputTokens,
          embedTokens,
          embedModel: params.embedModel || null,
          webSearchCall,
        },
      });
    } catch (error) {
      if (params.documentId) {
        try {
          await this.prisma.tokenUsage.create({
            data: {
              userId: params.userId,
              documentId: null,
              convId: params.convId || null,
              sessionId: params.sessionId || null,
              eventType: params.eventType || 'unknown',
              modelId: params.modelId || null,
              inputTokens,
              outputTokens,
              embedTokens,
              embedModel: params.embedModel || null,
              webSearchCall,
            },
          });
          return;
        } catch {
          // Bỏ qua lỗi fallback
        }
      }
      this.logger.warn(
        `Failed to record token usage for user [${params.userId}]: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Bóc tách thông tin token từ Kafka response payload.
   */
  extractUsageFromPayload(
    payload: Record<string, unknown>,
  ): RecordTokenUsageDto | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const userId = String(payload.user_id || payload.userId || '');
    if (!userId) {
      return null;
    }

    const nested =
      (payload.token_usage as Record<string, unknown> | undefined) ||
      (payload.usage as Record<string, unknown> | undefined) ||
      {};

    const inputTokens =
      payload.input_tokens ?? payload.inputTokens ?? nested.input_tokens ?? 0;
    const outputTokens =
      payload.output_tokens ??
      payload.outputTokens ??
      nested.output_tokens ??
      0;
    const embedTokens =
      payload.embed_tokens ?? payload.embedTokens ?? nested.embed_tokens ?? 0;
    const webSearchCall =
      payload.web_search_call ??
      payload.webSearchCall ??
      nested.web_search_call ??
      0;
    const embedModel =
      payload.embed_model ?? payload.embedModel ?? nested.embed_model;
    const modelId = payload.model_id ?? payload.modelId ?? nested.model_id;

    return {
      userId,
      documentId: payload.document_id
        ? String(payload.document_id)
        : payload.documentId
          ? String(payload.documentId)
          : undefined,
      convId: payload.conv_id
        ? String(payload.conv_id)
        : payload.convId
          ? String(payload.convId)
          : undefined,
      sessionId: payload.session_id
        ? String(payload.session_id)
        : payload.sessionId
          ? String(payload.sessionId)
          : undefined,
      eventType: String(payload.event_type || payload.eventType || 'unknown'),
      modelId: modelId ? String(modelId) : undefined,
      inputTokens: Number(inputTokens) || 0,
      outputTokens: Number(outputTokens) || 0,
      embedTokens: Number(embedTokens) || 0,
      embedModel: embedModel ? String(embedModel) : undefined,
      webSearchCall: Number(webSearchCall) || 0,
    };
  }

  /**
   * Trích xuất và ghi nhận token trực tiếp từ response payload.
   */
  async recordUsageFromPayload(
    payload: Record<string, unknown>,
  ): Promise<void> {
    const dto = this.extractUsageFromPayload(payload);
    if (dto) {
      await this.recordUsage(dto);
    }
  }

  /**
   * Thống kê tổng lượng token tiêu thụ theo người dùng.
   */
  async getUserSummary(userId: string): Promise<UserTokenUsageSummary> {
    const aggregate = await this.prisma.tokenUsage.aggregate({
      where: { userId },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        embedTokens: true,
        webSearchCall: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      userId,
      totalInputTokens: aggregate._sum.inputTokens ?? 0,
      totalOutputTokens: aggregate._sum.outputTokens ?? 0,
      totalEmbedTokens: aggregate._sum.embedTokens ?? 0,
      totalWebSearchCalls: aggregate._sum.webSearchCall ?? 0,
      totalRequests: aggregate._count.id ?? 0,
    };
  }

  /**
   * Thống kê tổng lượng token tiêu thụ theo tài liệu.
   */
  async getDocumentSummary(
    documentId: string,
  ): Promise<DocumentTokenUsageSummary> {
    const aggregate = await this.prisma.tokenUsage.aggregate({
      where: { documentId },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        embedTokens: true,
        webSearchCall: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      documentId,
      totalInputTokens: aggregate._sum.inputTokens ?? 0,
      totalOutputTokens: aggregate._sum.outputTokens ?? 0,
      totalEmbedTokens: aggregate._sum.embedTokens ?? 0,
      totalWebSearchCalls: aggregate._sum.webSearchCall ?? 0,
      totalRequests: aggregate._count.id ?? 0,
    };
  }
}
