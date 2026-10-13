import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobsKafkaProducer } from './kafka/jobs-kafka.producer';
import { JobsKafkaConsumer } from './kafka/jobs-kafka.consumer';

import { JobFallbackService } from './helpers/job-fallback.service';

@Module({
  controllers: [JobController, JobsKafkaConsumer],
  providers: [JobService, JobsKafkaProducer, JobFallbackService],
  exports: [JobService, JobsKafkaProducer, JobFallbackService],
})
export class JobsModule {}
