import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { firstValueFrom } from 'rxjs';
import { KAFKA_CLIENT } from '../common/messaging.tokens';
import { BaseKafkaRequestDto } from '../common/kafka/dto/base-kafka-request.dto';
import { KAFKA_ERROR_CODES } from '../common/kafka/kafka.constants';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(
    @Inject(KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.kafkaClient.connect();
      const brokers = this.configService.get<string[]>('kafka.brokers') || [];
      this.logger.log(
        `Kafka Producer connected successfully to broker(s): ${brokers.join(', ')}`,
      );
      this.logConfiguredTopics();
    } catch (error) {
      this.logger.warn(
        `Unable to connect to Kafka broker on startup. Offline/fallback mode active: ${(error as Error).message}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.kafkaClient.close();
    } catch (error) {
      this.logger.warn(
        `Error closing Kafka client: ${(error as Error).message}`,
      );
    }
  }

  logConfiguredTopics(): void {
    const topics =
      this.configService.get<
        Record<string, { request: string; response: string }>
      >('kafka.topics');
    const isLocal = this.configService.get<boolean>('kafka.isLocal');

    this.logger.log(`Active Kafka Topics (isLocal: ${isLocal}):`);
    if (topics) {
      for (const [domain, conf] of Object.entries(topics)) {
        const topicConf = conf as { request: string; response: string };
        this.logger.log(
          ` - [${domain}] Request: ${topicConf.request} | Response: ${topicConf.response}`,
        );
      }
    }
  }

  async publish<T extends object>(topic: string, payload: T): Promise<void> {
    await this.validatePayload(payload);

    try {
      await firstValueFrom(this.kafkaClient.emit(topic, payload));
      const eventType = (payload as Record<string, unknown>).event_type;
      this.logger.debug(
        `Published message to topic [${topic}] for event [${String(eventType)}]`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish message to topic [${topic}]: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async validatePayload<T extends object>(payload: T): Promise<void> {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException({
        event_type: 'unknown',
        error_code: KAFKA_ERROR_CODES.INVALID_PARAMS,
        error: 'INVALID_PARAMS',
        message: 'Payload must be a non-null object',
      });
    }

    const dtoInstance = plainToInstance(BaseKafkaRequestDto, payload);
    const errors = await validate(dtoInstance);

    if (errors.length > 0) {
      const messages = errors.flatMap((errorItem: ValidationError) =>
        Object.values(errorItem.constraints || {}),
      );
      const eventType =
        (payload as Record<string, unknown>).event_type || 'unknown';

      throw new BadRequestException({
        event_type: eventType,
        error_code: KAFKA_ERROR_CODES.INVALID_PARAMS,
        error: 'INVALID_PARAMS',
        message: `Validation failed for Kafka request: ${messages.join('; ')}`,
        details: messages,
      });
    }
  }
}
