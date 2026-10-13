import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import Redis from 'ioredis';
import { KAFKA_CLIENT, REDIS_CLIENT } from '../common/messaging.tokens';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerController } from './kafka-consumer.controller';
import { RequestCorrelationService } from './request-correlation.service';
import { AiStatusMapperService } from '../common/services/ai-status-mapper.service';
import { StreamingManagerService } from '../common/streaming/streaming-manager.service';
import { TimeoutManagerService } from '../common/services/timeout-manager.service';
import { InterruptResumeService } from '../common/services/interrupt-resume.service';
import { TokenUsageService } from '../common/services/token-usage.service';
import { TokenUsageController } from '../common/controllers/token-usage.controller';
import { SmokeTestController } from './smoke-test.controller';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: KAFKA_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.getOrThrow<string>('kafka.clientId'),
              brokers: configService.getOrThrow<string[]>('kafka.brokers'),
              ssl: configService.get<boolean>('kafka.ssl', false),
            },
            consumer: {
              groupId: configService.getOrThrow<string>('kafka.groupId'),
              allowAutoTopicCreation: true,
            },
            producer: {
              allowAutoTopicCreation: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [
    KafkaConsumerController,
    TokenUsageController,
    SmokeTestController,
  ],
  providers: [
    KafkaProducerService,
    RequestCorrelationService,
    AiStatusMapperService,
    StreamingManagerService,
    TimeoutManagerService,
    InterruptResumeService,
    TokenUsageService,
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new Redis(configService.getOrThrow<string>('redis.url'), {
          lazyConnect: true,
          keyPrefix: configService.getOrThrow<string>('redis.keyPrefix'),
          connectTimeout: configService.getOrThrow<number>(
            'redis.connectTimeout',
          ),
          maxRetriesPerRequest: 1,
        }),
    },
  ],
  exports: [
    ClientsModule,
    REDIS_CLIENT,
    KafkaProducerService,
    RequestCorrelationService,
    AiStatusMapperService,
    StreamingManagerService,
    TimeoutManagerService,
    InterruptResumeService,
    TokenUsageService,
  ],
})
export class MessagingModule {}
