import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';
import { Job } from '@prisma/client';
import { KAFKA_CLIENT } from '../../../common/messaging.tokens';
import { DEFAULT_AI_MODEL } from '../../../common/kafka/kafka.constants';

@Injectable()
export class JobsKafkaProducer implements OnModuleInit {
  private readonly logger = new Logger(JobsKafkaProducer.name);

  constructor(
    @Inject(KAFKA_CLIENT) private readonly clientKafka: ClientKafka,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.clientKafka.connect();
      this.logger.log('Successfully connected Kafka Producer');
    } catch (error) {
      this.logger.warn(`Kafka producer connection deferred/failed: ${error}`);
    }
  }

  async publishJob(job: Job): Promise<void> {
    const topicsConfig =
      this.configService.get<Record<string, { request: string }>>(
        'kafka.topics',
      );
    const moduleConfig = topicsConfig?.[job.module];

    if (!moduleConfig?.request) {
      this.logger.error(`No request topic found for module: ${job.module}`);
      return;
    }

    const isLocal = this.configService.get<boolean>('app.isLocal', true);
    const localLlmBaseUrl = this.configService.get<string>(
      'app.localLlmBaseUrl',
    );

    const topic = moduleConfig.request;
    const payload = {
      job_id: job.id,
      module: job.module,
      action: job.action,
      document_id: job.documentId || undefined,
      session_id: job.sessionId || undefined,
      resume_step: job.resumeStep || undefined,
      model_id: isLocal ? DEFAULT_AI_MODEL : undefined,
      localllm_base_url: isLocal ? localLlmBaseUrl : undefined,
      payload: job.payload || {},
    };

    this.logger.log(
      `Publishing job ${job.id} [${job.module}:${job.action}] to topic: ${topic}`,
    );

    try {
      this.clientKafka.emit(topic, JSON.stringify(payload));
    } catch (error) {
      this.logger.error(
        `Failed to publish job ${job.id} to Kafka topic ${topic}: ${error}`,
      );
    }
  }
}
