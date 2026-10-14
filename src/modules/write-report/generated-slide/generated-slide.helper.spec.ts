import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { JobStatus, SlideStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { GeneratedSlideHelper } from './generated-slide.helper';

describe('GeneratedSlideHelper', () => {
  describe('extractPptxUrl', () => {
    it('should extract pptx URL from various candidate fields', () => {
      expect(
        GeneratedSlideHelper.extractPptxUrl({
          pptx_url: 'http://minio/1.pptx',
        }),
      ).toBe('http://minio/1.pptx');
      expect(
        GeneratedSlideHelper.extractPptxUrl({
          file_url: 'http://minio/2.pptx',
        }),
      ).toBe('http://minio/2.pptx');
      expect(
        GeneratedSlideHelper.extractPptxUrl({ url: 'http://minio/3.pptx' }),
      ).toBe('http://minio/3.pptx');
      expect(
        GeneratedSlideHelper.extractPptxUrl({
          download_url: 'http://minio/4.pptx',
        }),
      ).toBe('http://minio/4.pptx');
      expect(GeneratedSlideHelper.extractPptxUrl({})).toBeNull();
      expect(GeneratedSlideHelper.extractPptxUrl({ pptx_url: '' })).toBeNull();
    });
  });

  describe('failSlideJob', () => {
    it('should update job and slide record to error and throw BadRequestException', async () => {
      const mockPrisma = {
        job: { update: jest.fn<any>().mockResolvedValue({}) },
        generatedSlide: { update: jest.fn<any>().mockResolvedValue({}) },
      };

      await expect(
        GeneratedSlideHelper.failSlideJob(
          mockPrisma as unknown as PrismaService,
          'j1',
          's1',
          634,
          'Slide generation failed',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: 'j1' },
        data: {
          status: JobStatus.error,
          errorCode: '634',
          errorMessage: 'Slide generation failed',
        },
      });

      expect(mockPrisma.generatedSlide.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { status: SlideStatus.error },
      });
    });
  });
});
