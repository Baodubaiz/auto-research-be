import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import Redis from 'ioredis';
import { KAFKA_CLIENT, REDIS_CLIENT } from '../common/messaging.tokens';

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
              allowAutoTopicCreation: false,
            },
            producer: {
              allowAutoTopicCreation: false,
            },
          },
        }),
      },
    ]),
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new Redis(configService.getOrThrow<string>('redis.url'), {
          lazyConnect: true,
          keyPrefix: configService.getOrThrow<string>('redis.keyPrefix'),
          connectTimeout: configService.getOrThrow<number>('redis.connectTimeout'),
          maxRetriesPerRequest: 1,
        }),
    },
  ],
  exports: [ClientsModule, REDIS_CLIENT],
})
export class MessagingModule {}