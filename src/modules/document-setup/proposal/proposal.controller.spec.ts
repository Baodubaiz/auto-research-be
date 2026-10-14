import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ProposalController } from './proposal.controller';
import { ProposalService } from './proposal.service';
import { ProposalIdeationService } from './proposal-ideation.service';
import { ProposalDetailsService } from './proposal-details.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import {
  GenerateDomainsDto,
  GenerateKeywordsDto,
  GenerateSubdomainsDto,
  GenerateTitlesDto,
} from './dto/generate-ideation.dto';
import {
  GenerateTitleDescriptionDto,
  GenerateTitleDescriptionNoInfoDto,
  GetResearchTypeDto,
  MixTitlesDto,
} from './dto/proposal-details.dto';

describe('ProposalController', () => {
  let controller: ProposalController;
  let mockProposalService: Record<string, any>;
  let mockIdeationService: Record<string, any>;
  let mockDetailsService: Record<string, any>;

  const userId = '00000000-0000-0000-0000-000000000001';

  beforeEach(async () => {
    mockProposalService = {
      create: jest.fn<any>(),
      findAll: jest.fn<any>(),
      findOne: jest.fn<any>(),
      select: jest.fn<any>(),
      update: jest.fn<any>(),
      remove: jest.fn<any>(),
    };

    mockIdeationService = {
      generateDomains: jest.fn<any>(),
      generateSubdomains: jest.fn<any>(),
      generateKeywords: jest.fn<any>(),
      generateTitles: jest.fn<any>(),
    };

    mockDetailsService = {
      generateTitleDescription: jest.fn<any>(),
      generateTitleDescriptionNoInfo: jest.fn<any>(),
      mixTitles: jest.fn<any>(),
      getResearchType: jest.fn<any>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProposalController],
      providers: [
        { provide: ProposalService, useValue: mockProposalService },
        { provide: ProposalIdeationService, useValue: mockIdeationService },
        { provide: ProposalDetailsService, useValue: mockDetailsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProposalController>(ProposalController);
  });

  describe('Ideation Endpoints', () => {
    it('should delegate generateDomains to ideationService', async () => {
      const dto: GenerateDomainsDto = { documentId: 'doc-1' };
      mockIdeationService.generateDomains.mockResolvedValue({ domains: [] });
      const res = await controller.generateDomains(userId, dto);
      expect(res).toEqual({ domains: [] });
      expect(mockIdeationService.generateDomains).toHaveBeenCalledWith(
        userId,
        dto,
      );
    });

    it('should delegate generateSubdomains to ideationService', async () => {
      const dto: GenerateSubdomainsDto = {
        documentId: 'doc-1',
        field: 'CS',
        domain: 'AI',
      };
      mockIdeationService.generateSubdomains.mockResolvedValue({
        subdomains: [],
      });
      const res = await controller.generateSubdomains(userId, dto);
      expect(res).toEqual({ subdomains: [] });
      expect(mockIdeationService.generateSubdomains).toHaveBeenCalledWith(
        userId,
        dto,
      );
    });

    it('should delegate generateKeywords to ideationService', async () => {
      const dto: GenerateKeywordsDto = {
        documentId: 'doc-1',
        field: 'CS',
        domain: 'AI',
      };
      mockIdeationService.generateKeywords.mockResolvedValue({ keywords: [] });
      const res = await controller.generateKeywords(userId, dto);
      expect(res).toEqual({ keywords: [] });
      expect(mockIdeationService.generateKeywords).toHaveBeenCalledWith(
        userId,
        dto,
      );
    });

    it('should delegate generateTitles to ideationService', async () => {
      const dto: GenerateTitlesDto = {
        documentId: 'doc-1',
        field: 'CS',
        domain: 'AI',
      };
      mockIdeationService.generateTitles.mockResolvedValue({ proposals: [] });
      const res = await controller.generateTitles(userId, dto);
      expect(res).toEqual({ proposals: [] });
      expect(mockIdeationService.generateTitles).toHaveBeenCalledWith(
        userId,
        dto,
      );
    });
  });

  describe('Details Endpoints', () => {
    it('should delegate generateTitleDescription to detailsService', async () => {
      const dto: GenerateTitleDescriptionDto = {
        documentId: 'doc-1',
        title: 'T',
      };
      mockDetailsService.generateTitleDescription.mockResolvedValue({
        ok: true,
      });
      const res = await controller.generateTitleDescription(userId, dto);
      expect(res).toEqual({ ok: true });
      expect(mockDetailsService.generateTitleDescription).toHaveBeenCalledWith(
        userId,
        dto,
      );
    });

    it('should delegate generateTitleDescriptionNoInfo to detailsService', async () => {
      const dto: GenerateTitleDescriptionNoInfoDto = {
        documentId: 'doc-1',
        title: 'T',
      };
      mockDetailsService.generateTitleDescriptionNoInfo.mockResolvedValue({
        ok: true,
      });
      const res = await controller.generateTitleDescriptionNoInfo(userId, dto);
      expect(res).toEqual({ ok: true });
      expect(
        mockDetailsService.generateTitleDescriptionNoInfo,
      ).toHaveBeenCalledWith(userId, dto);
    });

    it('should delegate mixTitles to detailsService', async () => {
      const dto: MixTitlesDto = { documentId: 'doc-1', titles: ['T1', 'T2'] };
      mockDetailsService.mixTitles.mockResolvedValue({ proposals: [] });
      const res = await controller.mixTitles(userId, dto);
      expect(res).toEqual({ proposals: [] });
      expect(mockDetailsService.mixTitles).toHaveBeenCalledWith(userId, dto);
    });

    it('should delegate getResearchType to detailsService', async () => {
      const dto: GetResearchTypeDto = { documentId: 'doc-1', title: 'T' };
      mockDetailsService.getResearchType.mockResolvedValue({
        research_type: 'qualitative',
      });
      const res = await controller.getResearchType(userId, dto);
      expect(res).toEqual({ research_type: 'qualitative' });
      expect(mockDetailsService.getResearchType).toHaveBeenCalledWith(
        userId,
        dto,
      );
    });
  });

  describe('CRUD Endpoints', () => {
    it('should delegate create to proposalService', async () => {
      const dto: CreateProposalDto = {
        documentId: 'doc-1',
        title: 'New Proposal',
      };
      mockProposalService.create.mockResolvedValue({ id: 'prop-1', ...dto });
      const res = await controller.create(userId, dto);
      expect(res.id).toBe('prop-1');
      expect(mockProposalService.create).toHaveBeenCalledWith(userId, dto);
    });

    it('should delegate findAll to proposalService', async () => {
      mockProposalService.findAll.mockResolvedValue([{ id: 'prop-1' }]);
      const res = await controller.findAll(userId, 'doc-1');
      expect(res).toHaveLength(1);
      expect(mockProposalService.findAll).toHaveBeenCalledWith(userId, 'doc-1');
    });

    it('should delegate findOne to proposalService', async () => {
      mockProposalService.findOne.mockResolvedValue({ id: 'prop-1' });
      const res = await controller.findOne(userId, 'prop-1');
      expect(res.id).toBe('prop-1');
      expect(mockProposalService.findOne).toHaveBeenCalledWith(
        userId,
        'prop-1',
      );
    });

    it('should delegate select to proposalService', async () => {
      mockProposalService.select.mockResolvedValue({
        id: 'prop-1',
        isSelected: true,
      });
      const res = await controller.select(userId, 'prop-1');
      expect(res.isSelected).toBe(true);
      expect(mockProposalService.select).toHaveBeenCalledWith(userId, 'prop-1');
    });

    it('should delegate update to proposalService', async () => {
      const dto: UpdateProposalDto = { title: 'Updated' };
      mockProposalService.update.mockResolvedValue({ id: 'prop-1', ...dto });
      const res = await controller.update(userId, 'prop-1', dto);
      expect(res.title).toBe('Updated');
      expect(mockProposalService.update).toHaveBeenCalledWith(
        userId,
        'prop-1',
        dto,
      );
    });

    it('should delegate remove to proposalService', async () => {
      mockProposalService.remove.mockResolvedValue({ message: 'Deleted' });
      const res = await controller.remove(userId, 'prop-1');
      expect(res).toEqual({ message: 'Deleted' });
      expect(mockProposalService.remove).toHaveBeenCalledWith(userId, 'prop-1');
    });
  });
});
