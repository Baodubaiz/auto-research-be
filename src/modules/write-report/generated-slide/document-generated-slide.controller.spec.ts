import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { DocumentGeneratedSlideController } from './document-generated-slide.controller';
import { GeneratedSlideService } from './generated-slide.service';
import { GeneratedSlideAiService } from './generated-slide-ai.service';
import { GenerateSlideRequestDto } from './dto/generate-slide-request.dto';

describe('DocumentGeneratedSlideController', () => {
  let controller: DocumentGeneratedSlideController;
  let mockService: any;
  let mockAiService: any;

  const userId = '00000000-0000-0000-0000-000000000001';
  const documentId = '00000000-0000-0000-0000-000000000002';

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn<any>().mockResolvedValue([{ id: 's1' }]),
    };
    mockAiService = {
      generateSlides: jest.fn<any>().mockResolvedValue({
        jobId: 'j1',
        slideId: 's1',
        status: 'started',
      }),
      getSlideStatus: jest.fn<any>().mockResolvedValue({ status: 'completed' }),
      getSlideStream: jest.fn<any>().mockResolvedValue(of({ data: 'chunk' })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentGeneratedSlideController],
      providers: [
        { provide: GeneratedSlideService, useValue: mockService },
        { provide: GeneratedSlideAiService, useValue: mockAiService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DocumentGeneratedSlideController>(
      DocumentGeneratedSlideController,
    );
  });

  it('should find all slides for document', async () => {
    const res = await controller.findAll(userId, documentId);
    expect(res).toEqual([{ id: 's1' }]);
    expect(mockService.findAll).toHaveBeenCalledWith(userId, documentId);
  });

  it('should trigger generate slides with documentId assigned', async () => {
    const dto: GenerateSlideRequestDto = { documentId: 'temp-id' };
    const res = await controller.generate(userId, documentId, dto);
    expect(res).toEqual({ jobId: 'j1', slideId: 's1', status: 'started' });
    expect(mockAiService.generateSlides).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({ documentId }),
    );
  });

  it('should get slide status', async () => {
    const res = await controller.getStatus(userId, documentId);
    expect(res).toEqual({ status: 'completed' });
    expect(mockAiService.getSlideStatus).toHaveBeenCalledWith(
      userId,
      documentId,
    );
  });

  it('should get slide stream', async () => {
    const res = await controller.stream(userId, documentId);
    expect(res).toBeDefined();
    expect(mockAiService.getSlideStream).toHaveBeenCalledWith(
      userId,
      documentId,
    );
  });
});
