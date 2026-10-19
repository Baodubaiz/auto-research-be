import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  AiInDocDto,
  EnhanceAllDto,
  EnhanceDto,
  GetSuggestionsDto,
} from './dto/enhancement-ai.dto';
import { EnhancementAiService } from './enhancement-ai.service';

@Controller('enhancement')
@UseGuards(JwtAuthGuard)
export class EnhancementAiController {
  constructor(private readonly enhancementAi: EnhancementAiService) {}

  @Post('ai-in-doc')
  @HttpCode(HttpStatus.OK)
  aiInDoc(
    @CurrentUser('sub') userId: string,
    @Body() dto: AiInDocDto,
  ) {
    return this.enhancementAi.aiInDoc(userId, dto);
  }

  @Post('suggestions')
  @HttpCode(HttpStatus.OK)
  getSuggestions(
    @CurrentUser('sub') userId: string,
    @Body() dto: GetSuggestionsDto,
  ) {
    return this.enhancementAi.getSuggestions(userId, dto);
  }

  @Post('enhance')
  @HttpCode(HttpStatus.OK)
  enhance(
    @CurrentUser('sub') userId: string,
    @Body() dto: EnhanceDto,
  ) {
    return this.enhancementAi.enhance(userId, dto);
  }

  @Post('enhance-all')
  @HttpCode(HttpStatus.OK)
  enhanceAll(
    @CurrentUser('sub') userId: string,
    @Body() dto: EnhanceAllDto,
  ) {
    return this.enhancementAi.enhanceAll(userId, dto);
  }
}
