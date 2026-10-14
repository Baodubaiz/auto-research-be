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
import { CreateOutlineDto } from './dto/create-outline.dto';
import { UpdateOutlineDto } from './dto/update-outline.dto';
import {
  GenerateOutlineAiDto,
  GenerateOutlineWithRefsDto,
  ModifyOutlineAiDto,
  UpdateUserRefsDto,
} from './dto/outline-ai.dto';
import { OutlineService } from './outline.service';
import { OutlineAiService } from './outline-ai.service';

@Controller('outlines')
@UseGuards(JwtAuthGuard)
export class OutlineController {
  constructor(
    private readonly outlineService: OutlineService,
    private readonly outlineAiService: OutlineAiService,
  ) {}

  @Post('generate')
  generateOutline(
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateOutlineAiDto,
  ) {
    return this.outlineAiService.generateOutline(userId, dto);
  }

  @Post('modify')
  modifyOutline(
    @CurrentUser('sub') userId: string,
    @Body() dto: ModifyOutlineAiDto,
  ) {
    return this.outlineAiService.modifyOutline(userId, dto);
  }

  @Post('generate-with-refs')
  generateOutlineWithRefs(
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateOutlineWithRefsDto,
  ) {
    return this.outlineAiService.generateOutlineWithRefs(userId, dto);
  }

  @Post('update-refs')
  updateUserRefs(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateUserRefsDto,
  ) {
    return this.outlineAiService.updateUserRefs(userId, dto);
  }

  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateOutlineDto) {
    return this.outlineService.create(userId, dto);
  }

  @Get()
  findByDocument(
    @CurrentUser('sub') userId: string,
    @Query('documentId') documentId: string,
  ) {
    return this.outlineService.findByDocument(userId, documentId);
  }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.outlineService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOutlineDto,
  ) {
    return this.outlineService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.outlineService.remove(userId, id);
  }
}
