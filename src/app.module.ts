import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { PrismaModule } from './database/prisma.module';
import { MessagingModule } from './messaging/messaging.module';
import { AuthModule } from './modules/auth/auth/auth.module';
import { DocumentSetupModule } from './modules/document-setup/document-setup.module';
import { WriteReportModule } from './modules/write-report/write-report.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { EnhancementModule } from './modules/enhancement/enhancement.module';
import { JobsModule } from './modules/jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: configuration,
    }),
    PrismaModule,
    MessagingModule,
    AuthModule,
    DocumentSetupModule,
    WriteReportModule,
    ChatbotModule,
    EnhancementModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
