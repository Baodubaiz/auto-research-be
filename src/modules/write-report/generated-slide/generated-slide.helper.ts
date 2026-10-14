import { BadRequestException } from '@nestjs/common';
import { JobStatus, SlideStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { getAiErrorName } from '../../../common/constants/ai-error-codes';

export class GeneratedSlideHelper {
  static extractPptxUrl(chunk: Record<string, unknown>): string | null {
    const url =
      chunk.pptx_url || chunk.file_url || chunk.url || chunk.download_url;
    return typeof url === 'string' && url.length > 0 ? url : null;
  }

  static async failSlideJob(
    prisma: PrismaService,
    jobId: string,
    slideId: string,
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

    await prisma.generatedSlide.update({
      where: { id: slideId },
      data: { status: SlideStatus.error },
    });

    throw new BadRequestException({
      statusCode: 400,
      errorCode: code,
      error: getAiErrorName(code),
      message: msg,
    });
  }
}
