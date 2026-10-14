import { BadRequestException } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { getAiErrorName } from '../../../common/constants/ai-error-codes';

export class WriteContentHelper {
  static extractMarkdown(
    sectionsMap: Map<string, string>,
    chunk: Record<string, unknown>,
  ): string | null {
    if (chunk.section && typeof chunk.section === 'object') {
      const sectionObj = chunk.section as Record<string, unknown>;
      const name = String(sectionObj.name || 'Phần');
      const content = String(sectionObj.content || '');
      sectionsMap.set(name, content);
      return Array.from(sectionsMap.entries())
        .map(([sName, sContent]) => `## ${sName}\n\n${sContent}`)
        .join('\n\n');
    }

    if (typeof chunk.content === 'string') {
      return chunk.content;
    }

    if (typeof chunk.full_content === 'string') {
      return chunk.full_content;
    }

    return null;
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
