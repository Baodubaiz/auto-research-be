import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3001);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  const corsOrigins = configService.get<string[]>('app.corsOrigins', [
    'http://localhost:3000',
  ]);
  const bodyLimit = configService.get<string>('app.bodyLimit', '10mb');
  const kafkaEnabled =
    configService.get<string>('KAFKA_ENABLED', 'true') !== 'false';

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  // Start HTTP server immediately — always available
  await app.listen(port);
  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`,
  );

  // Only connect Kafka if KAFKA_ENABLED !== 'false' in .env
  if (kafkaEnabled) {
    const rawBrokers =
      configService.get<string | string[]>('kafka.brokers') ||
      '167.254.70.125:9092';
    const brokers = Array.isArray(rawBrokers)
      ? rawBrokers
      : String(rawBrokers)
          .split(',')
          .map((b) => b.trim());

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId:
            configService.get<string>(
              'kafka.clientId',
              'autoresearch-backend',
            ) + '-consumer',
          brokers,
          ssl: configService.get<boolean>('kafka.ssl', false),
        },
        consumer: {
          groupId: configService.get<string>(
            'kafka.groupId',
            'autoresearch-group',
          ),
          allowAutoTopicCreation: true,
        },
      },
    });

    app
      .startAllMicroservices()
      .then(() => logger.log('✅ Kafka microservice connected'))
      .catch((err: any) =>
        logger.warn(`⚠️  Kafka unavailable (non-fatal): ${err.message}`),
      );
  } else {
    logger.warn(
      '⚠️  Kafka disabled (KAFKA_ENABLED=false). Set KAFKA_ENABLED=true in .env to enable.',
    );
  }
}
bootstrap();
