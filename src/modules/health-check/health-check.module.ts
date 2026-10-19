import { Module } from '@nestjs/common';
import { HealthCheckController } from './health-check.controller';
import { HealthCheckService } from './health-check.service';
import { RedisStateService } from '../../common/services/redis-state.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@Module({
  controllers: [HealthCheckController],
  providers: [HealthCheckService, RedisStateService, ApiKeyGuard],
  exports: [HealthCheckService, RedisStateService],
})
export class HealthCheckModule {}
