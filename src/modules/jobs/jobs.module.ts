import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobsKafkaProducer } from './kafka/jobs-kafka.producer';
import { JobsKafkaConsumer } from './kafka/jobs-kafka.consumer';

@Module({
  controllers: [JobController, JobsKafkaConsumer],
  providers: [JobService, JobsKafkaProducer],
  exports: [JobService, JobsKafkaProducer],
})
export class JobsModule {}
