import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ReferenceController } from './reference.controller';
import { ReferenceService } from './reference.service';
import { SearchPapersDto } from './dto/search-papers.dto';
import { CreateReferenceDto } from './dto/create-reference.dto';
import { UpdateReferenceDto } from './dto/update-reference.dto';

describe('ReferenceController', () => {
  let controller: ReferenceController;
  let mockService: Record<string, any>;

  const userId = '00000000-0000-0000-0000-000000000001';

  beforeEach(async () => {
    mockService = {
      searchPapers: jest.fn<any>(),
      create: jest.fn<any>(),
      findAll: jest.fn<any>(),
      findOne: jest.fn<any>(),
      update: jest.fn<any>(),
      remove: jest.fn<any>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReferenceController],
      providers: [{ provide: ReferenceService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReferenceController>(ReferenceController);
  });

  it('should delegate searchPapers to referenceService', async () => {
    const dto: SearchPapersDto = {
      documentId: 'doc-1',
      field: 'CS',
      query: 'AI',
    };
    const expected = {
      jobId: 'job-1',
      sessionId: 'sess-1',
      papers: [],
      total: 0,
    };
    mockService.searchPapers.mockResolvedValue(expected);

    const result = await controller.searchPapers(userId, dto);
    expect(result).toEqual(expected);
    expect(mockService.searchPapers).toHaveBeenCalledWith(userId, dto);
  });

  it('should delegate create to referenceService', async () => {
    const dto: CreateReferenceDto = { title: 'Test Paper' };
    mockService.create.mockResolvedValue({ id: 'ref-1', ...dto });

    const result = await controller.create(userId, dto);
    expect(result.id).toBe('ref-1');
    expect(mockService.create).toHaveBeenCalledWith(dto, userId);
  });

  it('should delegate findAll to referenceService', async () => {
    mockService.findAll.mockResolvedValue([{ id: 'ref-1' }]);
    const result = await controller.findAll(userId);
    expect(result).toHaveLength(1);
    expect(mockService.findAll).toHaveBeenCalledWith(userId);
  });

  it('should delegate findOne to referenceService', async () => {
    mockService.findOne.mockResolvedValue({ id: 'ref-1' });
    const result = await controller.findOne(userId, 'ref-1');
    expect(result.id).toBe('ref-1');
    expect(mockService.findOne).toHaveBeenCalledWith('ref-1', userId);
  });

  it('should delegate update to referenceService', async () => {
    const dto: UpdateReferenceDto = { title: 'Updated' };
    mockService.update.mockResolvedValue({ id: 'ref-1', ...dto });

    const result = await controller.update(userId, 'ref-1', dto);
    expect(result.title).toBe('Updated');
    expect(mockService.update).toHaveBeenCalledWith('ref-1', dto, userId);
  });

  it('should delegate remove to referenceService', async () => {
    mockService.remove.mockResolvedValue({ message: 'Deleted' });
    const result = await controller.remove(userId, 'ref-1');
    expect(result).toEqual({ message: 'Deleted' });
    expect(mockService.remove).toHaveBeenCalledWith('ref-1', userId);
  });
});
