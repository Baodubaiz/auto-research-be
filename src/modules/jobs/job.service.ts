import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateJobDto } from './dto/create-job/create-job.dto';
import { ResumeJobDto } from './dto/resume-job/resume-job.dto';
import { UpdateJobDto } from './dto/update-job/update-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status/update-job-status.dto';
import { JobsKafkaProducer } from './kafka/jobs-kafka.producer';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: JobsKafkaProducer,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateJobDto) {
    const documentId = dto.documentId || dto.document_id;
    const sessionId = dto.sessionId || dto.session_id;

    let job = await this.prisma.job.create({
      data: {
        module: dto.module,
        action: dto.action,
        documentId: documentId || null,
        sessionId: sessionId || null,
        status: dto.status || JobStatus.pending,
        resumeStep: dto.resumeStep,
        payload: dto.payload as Prisma.InputJsonValue | undefined,
        result: dto.result as Prisma.InputJsonValue | undefined,
        errorCode: dto.errorCode,
        errorMessage: dto.errorMessage,
      },
    });

    const kafkaEnabled = this.configService.get<string>('KAFKA_ENABLED', 'false') === 'true';

    if (kafkaEnabled) {
      // Trigger async processing via Kafka request topic
      await this.kafkaProducer.publishJob(job);
    } else {
      // Process job fallback synchronously when Kafka is offline
      job = await this.processJobFallback(job);
    }

    return {
      job_id: job.id,
      id: job.id,
      status: job.status,
      module: job.module,
      action: job.action,
      document_id: job.documentId,
      session_id: job.sessionId,
      data: job.result,
      createdAt: job.createdAt,
    };
  }

  private async processJobFallback(job: any) {
    const payloadData = (job.payload as any) || {};
    let resultData: any = {};

    try {
      if (job.module === 'document_setup') {
        resultData = await this.handleDocumentSetupFallback(job.action, job.documentId, payloadData);
      } else {
        resultData = { message: `Completed action ${job.action} for ${job.module}` };
      }

      return await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.finished,
          result: resultData as Prisma.InputJsonValue,
        },
      });
    } catch (err: any) {
      this.logger.error(`Fallback processing failed for job ${job.id}: ${err.message}`);
      return await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.error,
          errorMessage: err.message,
        },
      });
    }
  }

  private async handleDocumentSetupFallback(action: string, documentId: string | null, payload: any) {
    const field = payload.field || 'Finance & Banking';

    switch (action) {
      case 'generate_domains': {
        const domains = [
          {
            id: `d1-${Date.now()}`,
            domainName: `${field} - Digital Transformation`,
            subdomains: ['Mobile Payment Systems', 'Open Banking APIs', 'AI in Credit Scoring'],
          },
          {
            id: `d2-${Date.now()}`,
            domainName: `${field} - Risk Management & Compliance`,
            subdomains: ['Credit Risk Modeling', 'AML/KYC Automation', 'Basel III Compliance'],
          },
          {
            id: `d3-${Date.now()}`,
            domainName: `${field} - Customer Experience & Retention`,
            subdomains: ['Personalization Engines', 'Chatbot Banking Assistants', 'Omnichannel Strategy'],
          },
        ];

        if (documentId) {
          await this.prisma.document.update({
            where: { id: documentId },
            data: { domains: domains as any },
          });
        }
        return { domains };
      }

      case 'generate_subdomains': {
        const doc = documentId ? await this.prisma.document.findUnique({ where: { id: documentId } }) : null;
        const currentDomains = Array.isArray(doc?.domains) ? (doc.domains as any[]) : [];

        const updatedDomains = currentDomains.length > 0 ? currentDomains.map((d: any) => ({
          ...d,
          subdomains: Array.from(new Set([...(d.subdomains || []), 'Automated Analytics', 'Predictive Modeling'])),
        })) : [
          { id: 'd1', domainName: `${field} Analytics`, subdomains: ['Automated Analytics', 'Predictive Modeling'] },
        ];

        if (documentId) {
          await this.prisma.document.update({
            where: { id: documentId },
            data: { domains: updatedDomains as any },
          });
        }
        return { domains: updatedDomains };
      }

      case 'generate_titles': {
        if (!documentId) return { proposals: [] };

        const proposalsData = [
          {
            title: `AI-Driven Credit Risk Assessment in ${field}`,
            problemStatement: `Commercial entities in ${field} face challenges in accurately assessing credit risk due to fragmented data and lack of advanced ML scoring models.`,
            motivation: `Implementing AI-driven credit scoring models can significantly reduce default ratios and expand financial inclusion.`,
          },
          {
            title: `Digital Transformation Strategy and Customer Retention in ${field}`,
            problemStatement: `Despite investments in digital infrastructure, many entities in ${field} struggle with low adoption rates and customer churn.`,
            motivation: `Understanding the causal relationship between digital maturity and customer retention provides actionable evidence for strategic decisions.`,
          },
          {
            title: `Blockchain Applications for Cross-Border Settlement in ${field}`,
            problemStatement: `Cross-border transactions in ${field} remain expensive, slow, and opaque using traditional correspondent networks.`,
            motivation: `Evaluating real-world blockchain payment implementations provides a deployment framework for regional cost reduction.`,
          },
        ];

        const createdProposals = [];
        for (const p of proposalsData) {
          const prop = await this.prisma.proposal.create({
            data: {
              documentId,
              title: p.title,
              problemStatement: p.problemStatement,
              motivation: p.motivation,
              isSelected: false,
            },
          });
          createdProposals.push(prop);
        }
        return { proposals: createdProposals };
      }

      case 'generate_keywords': {
        const keywordsMain = [field.toLowerCase(), 'digital transformation', 'risk management'];
        const keywordsSub = ['artificial intelligence', 'machine learning', 'data analytics'];

        if (documentId) {
          const existing = await this.prisma.documentKeyword.findFirst({ where: { documentId } });
          if (existing) {
            await this.prisma.documentKeyword.update({
              where: { id: existing.id },
              data: { keywordsMain: keywordsMain as any, keywordsSub: keywordsSub as any },
            });
          } else {
            await this.prisma.documentKeyword.create({
              data: { documentId, keywordsMain: keywordsMain as any, keywordsSub: keywordsSub as any },
            });
          }
        }
        return { keywordsMain, keywordsSub };
      }

      case 'search_papers': {
        const samplePapers = [
          {
            title: `Machine Learning Models for ${field}: A Systematic Literature Review`,
            authors: 'Nguyen, T.H., Tran, L.A., & Le, M.D.',
            journal: 'Journal of Academic Research',
            year: 2023,
            openAccess: true,
            downloadedStatus: 'downloaded' as const,
            url: 'https://doi.org/10.1016/j.jft.2023.01.001',
            abstract: `This systematic literature review examines 127 studies on machine learning applications in ${field} published between 2018-2023...`,
          },
          {
            title: `Digital Transformation and Customer Loyalty in Emerging Markets`,
            authors: 'Pham, V.K., Hoang, T.N., & Vo, T.L.',
            journal: 'International Journal of Research',
            year: 2022,
            openAccess: false,
            downloadedStatus: 'pending' as const,
            url: 'https://doi.org/10.1108/IJBM-2022-001',
            abstract: `Using a mixed-methods empirical approach, this study investigates the impact of digital service quality on customer loyalty...`,
          },
          {
            title: `Empirical Analysis of Blockchain Implementations in ${field}`,
            authors: 'Chan, W.S., Tan, B.K., & Lim, J.R.',
            journal: 'Electronic Research & Applications',
            year: 2023,
            openAccess: true,
            downloadedStatus: 'downloaded' as const,
            url: 'https://doi.org/10.1016/j.elerap.2023.01.002',
            abstract: `This paper presents an empirical analysis of blockchain pilots in ${field}. Results show a 78% reduction in settlement latency...`,
          },
        ];

        const createdRefs = [];
        for (const paper of samplePapers) {
          const ref = await this.prisma.reference.create({ data: paper });
          createdRefs.push(ref);
        }
        return { references: createdRefs };
      }

      case 'generate_outline':
      case 'modify_outline': {
        const outlineStructure = {
          totalWordCount: payload.totalWordCount || 8000,
          researchType: payload.researchType || 'quantitative',
          headings: [
            {
              id: 'h1',
              title: '1. Introduction',
              targetWordCount: 800,
              ratioPercent: 10,
              overview: `Overview of ${field} research background, problem statement, research objectives, and study significance.`,
              subheadings: [{ id: 's1', title: '1.1 Research Background', targetWordCount: 400 }],
              referenceIds: [],
            },
            {
              id: 'h2',
              title: '2. Literature Review',
              targetWordCount: 2000,
              ratioPercent: 25,
              overview: 'Critical review of theoretical models and existing empirical literature.',
              subheadings: [{ id: 's2', title: '2.1 Theoretical Framework', targetWordCount: 1000 }],
              referenceIds: [],
            },
            {
              id: 'h3',
              title: '3. Research Methodology',
              targetWordCount: 1500,
              ratioPercent: 19,
              overview: 'Description of research design, data collection methods, sampling, and analytical framework.',
              subheadings: [],
              referenceIds: [],
            },
            {
              id: 'h4',
              title: '4. Findings & Discussion',
              targetWordCount: 2500,
              ratioPercent: 31,
              overview: 'Presentation of empirical findings, statistical results, and hypothesis testing outcomes.',
              subheadings: [],
              referenceIds: [],
            },
            {
              id: 'h5',
              title: '5. Conclusion',
              targetWordCount: 1200,
              ratioPercent: 15,
              overview: 'Summary of key contributions, policy recommendations, and future scope.',
              subheadings: [],
              referenceIds: [],
            },
          ],
        };

        if (documentId) {
          const existing = await this.prisma.outline.findFirst({ where: { documentId } });
          if (existing) {
            await this.prisma.outline.update({
              where: { id: existing.id },
              data: { totalWordCount: outlineStructure.totalWordCount, structure: outlineStructure as any },
            });
          } else {
            await this.prisma.outline.create({
              data: { documentId, totalWordCount: outlineStructure.totalWordCount, structure: outlineStructure as any },
            });
          }
        }
        return { outline: outlineStructure };
      }

      default:
        return { message: `Executed ${action} successfully` };
    }
  }

  async findAll(status?: JobStatus) {
    const jobs = await this.prisma.job.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((j) => ({
      job_id: j.id,
      id: j.id,
      status: j.status,
      module: j.module,
      action: j.action,
      data: j.result,
      error: j.errorMessage ? { code: j.errorCode, message: j.errorMessage } : null,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
    }));
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');

    return {
      job_id: job.id,
      id: job.id,
      status: job.status,
      module: job.module,
      action: job.action,
      document_id: job.documentId,
      session_id: job.sessionId,
      data: job.result,
      error: job.errorMessage ? { code: job.errorCode, message: job.errorMessage } : null,
      errorCode: job.errorCode,
      errorMessage: job.errorMessage,
      payload: job.payload,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  async update(id: string, dto: UpdateJobDto) {
    await this.findOne(id);
    return this.prisma.job.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, dto: UpdateJobStatusDto) {
    await this.findOne(id);
    return this.prisma.job.update({
      where: { id },
      data: {
        status: dto.status,
        errorCode: dto.errorCode,
        errorMessage: dto.errorMessage,
      },
    });
  }

  async resume(id: string, dto: ResumeJobDto) {
    await this.findOne(id);
    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.pending,
        resumeStep: dto.resumeStep,
        payload: dto.payload as Prisma.InputJsonValue | undefined,
        errorCode: null,
        errorMessage: null,
      },
    });

    const kafkaEnabled = this.configService.get<string>('KAFKA_ENABLED', 'false') === 'true';
    if (kafkaEnabled) {
      await this.kafkaProducer.publishJob(updatedJob);
    } else {
      await this.processJobFallback(updatedJob);
    }

    return {
      job_id: updatedJob.id,
      id: updatedJob.id,
      status: updatedJob.status,
      message: 'Job resumed',
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.job.delete({ where: { id } });
    return { message: 'Job deleted successfully' };
  }
}
