import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { JobStatus } from '@prisma/client';
import { JobService } from '../job.service';

interface WorkerResponsePayload {
  job_id: string;
  status: JobStatus;
  data?: any;
  error?: string | null;
  error_code?: string | null;
  progress?: number;
}

@Controller()
export class JobsKafkaConsumer {
  private readonly logger = new Logger(JobsKafkaConsumer.name);

  constructor(private readonly jobService: JobService) {}

  @EventPattern('document_setup_response_local')
  @EventPattern('document_setup_response')
  async handleDocumentSetupResponse(@Payload() data: any) {
    await this.processWorkerResponse('document_setup', data);
  }

  @EventPattern('write_section_response_local')
  @EventPattern('write_section_response')
  async handleWriteSectionResponse(@Payload() data: any) {
    await this.processWorkerResponse('write_report', data);
  }

  @EventPattern('chatbot_response_local')
  @EventPattern('chatbot_response')
  async handleChatbotResponse(@Payload() data: any) {
    await this.processWorkerResponse('chatbot', data);
  }

  @EventPattern('enhancement_response_local')
  @EventPattern('enhancement_response')
  async handleEnhancementResponse(@Payload() data: any) {
    await this.processWorkerResponse('enhancement', data);
  }

  private async processWorkerResponse(module: string, rawData: any) {
    try {
      const response: WorkerResponsePayload =
        typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

      this.logger.log(
        `Received Kafka response for ${module} job ${response.job_id}: status=${response.status}`
      );

      if (!response.job_id) {
        this.logger.warn(`Kafka response missing job_id in module ${module}`);
        return;
      }

      await this.jobService.update(response.job_id, {
        status: response.status || JobStatus.finished,
        result: response.data ? response.data : undefined,
        errorMessage: response.error || undefined,
        errorCode: response.error_code || undefined,
      });
    } catch (error) {
      this.logger.error(`Error processing Kafka response for ${module}: ${error}`);
    }
  }
}

