import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateDatasetVariableDto } from './dto/create-dataset-variable.dto';
import { UpdateDatasetVariableDto } from './dto/update-dataset-variable.dto';

@Injectable()
export class DatasetVariableService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateDatasetVariableDto) {
    await this.ensureDataset(userId, dto.datasetId);
    return this.prisma.datasetVariable.create({ data: dto });
  }

  async findAll(userId: string, datasetId?: string) {
    if (datasetId) await this.ensureDataset(userId, datasetId);
    return this.prisma.datasetVariable.findMany({
      where: datasetId ? { datasetId } : { dataset: { document: { userId } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const variable = await this.prisma.datasetVariable.findFirst({ where: { id, dataset: { document: { userId } } } });
    if (!variable) throw new NotFoundException('Dataset variable not found');
    return variable;
  }

  async update(userId: string, id: string, dto: UpdateDatasetVariableDto) {
    const variable = await this.findOne(userId, id);
    return this.prisma.datasetVariable.update({ where: { id: variable.id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const variable = await this.findOne(userId, id);
    await this.prisma.datasetVariable.delete({ where: { id: variable.id } });
    return { message: 'Dataset variable deleted successfully' };
  }

  private async ensureDataset(userId: string, datasetId: string) {
    const dataset = await this.prisma.dataset.findFirst({ where: { id: datasetId, document: { userId } }, select: { id: true } });
    if (!dataset) throw new NotFoundException('Dataset not found');
  }
}