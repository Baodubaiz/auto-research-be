import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { WriteContentHelper } from './write-content.helper';

describe('WriteContentHelper', () => {
  describe('extractMarkdown', () => {
    it('should accumulate section objects and return combined markdown', () => {
      const sectionsMap = new Map<string, string>();
      const chunk1 = {
        section: { name: 'Chương 1', content: 'Nội dung chương 1' },
      };
      const res1 = WriteContentHelper.extractMarkdown(sectionsMap, chunk1);
      expect(res1).toBe('## Chương 1\n\nNội dung chương 1');

      const chunk2 = {
        section: { name: 'Chương 2', content: 'Nội dung chương 2' },
      };
      const res2 = WriteContentHelper.extractMarkdown(sectionsMap, chunk2);
      expect(res2).toBe(
        '## Chương 1\n\nNội dung chương 1\n\n## Chương 2\n\nNội dung chương 2',
      );
    });

    it('should extract content from content or full_content string', () => {
      const sectionsMap = new Map<string, string>();
      expect(
        WriteContentHelper.extractMarkdown(sectionsMap, {
          content: 'Direct content',
        }),
      ).toBe('Direct content');
      expect(
        WriteContentHelper.extractMarkdown(sectionsMap, {
          full_content: 'Full text',
        }),
      ).toBe('Full text');
      expect(WriteContentHelper.extractMarkdown(sectionsMap, {})).toBeNull();
    });
  });

  describe('failJob', () => {
    it('should update job status to error and throw BadRequestException', async () => {
      const mockPrisma = {
        job: { update: jest.fn<any>().mockResolvedValue({}) },
      };

      await expect(
        WriteContentHelper.failJob(
          mockPrisma as unknown as PrismaService,
          'j1',
          630,
          'Write content failed',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: 'j1' },
        data: {
          status: JobStatus.error,
          errorCode: '630',
          errorMessage: 'Write content failed',
        },
      });
    });
  });
});
