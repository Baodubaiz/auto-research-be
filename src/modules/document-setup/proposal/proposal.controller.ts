import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
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
import { ProposalService } from './proposal.service';
import { ProposalIdeationService } from './proposal-ideation.service';
import { ProposalDetailsService } from './proposal-details.service';

@Controller('proposals')
@UseGuards(JwtAuthGuard)
export class ProposalController {
  constructor(
    private readonly proposalService: ProposalService,
    private readonly ideationService: ProposalIdeationService,
    private readonly detailsService: ProposalDetailsService,
  ) {}

  @Post('generate-domains')
  generateDomains(
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateDomainsDto,
  ) {
    return this.ideationService.generateDomains(userId, dto);
  }

  @Post('generate-subdomains')
  generateSubdomains(
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateSubdomainsDto,
  ) {
    return this.ideationService.generateSubdomains(userId, dto);
  }

  @Post('generate-keywords')
  generateKeywords(
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateKeywordsDto,
  ) {
    return this.ideationService.generateKeywords(userId, dto);
  }

  @Post('generate-titles')
  generateTitles(
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateTitlesDto,
  ) {
    return this.ideationService.generateTitles(userId, dto);
  }

  @Post('generate-title-description')
  generateTitleDescription(
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateTitleDescriptionDto,
  ) {
    return this.detailsService.generateTitleDescription(userId, dto);
  }

  @Post('generate-title-description-no-info')
  generateTitleDescriptionNoInfo(
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateTitleDescriptionNoInfoDto,
  ) {
    return this.detailsService.generateTitleDescriptionNoInfo(userId, dto);
  }

  @Post('mix-titles')
  mixTitles(@CurrentUser('sub') userId: string, @Body() dto: MixTitlesDto) {
    return this.detailsService.mixTitles(userId, dto);
  }

  @Post('get-research-type')
  getResearchType(
    @CurrentUser('sub') userId: string,
    @Body() dto: GetResearchTypeDto,
  ) {
    return this.detailsService.getResearchType(userId, dto);
  }

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateProposalDto) {
    return this.proposalService.create(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('sub') userId: string,
    @Query('documentId') documentId: string,
  ) {
    return this.proposalService.findAll(userId, documentId);
  }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.proposalService.findOne(userId, id);
  }

  @Post(':id/select')
  select(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.proposalService.select(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProposalDto,
  ) {
    return this.proposalService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.proposalService.remove(userId, id);
  }
}
