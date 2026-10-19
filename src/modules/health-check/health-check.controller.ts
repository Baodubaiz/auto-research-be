import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { HealthCheckService } from './health-check.service';
import { HealthCheckWebhookDto } from './dto/health-check-webhook.dto';

@Controller('health-check')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Put(':id')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('id') id: string,
    @Body() dto: HealthCheckWebhookDto,
  ) {
    return await this.healthCheckService.handleHeartbeat(id, dto);
  }

  @Get(':id')
  async getStatus(@Param('id') id: string) {
    const status = await this.healthCheckService.getStatus(id);
    return {
      id,
      status: status || {
        processStatus: 1,
        eventType: 'unknown',
        aiError: null,
      },
    };
  }
}
