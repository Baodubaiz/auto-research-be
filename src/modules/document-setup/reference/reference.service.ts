import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateReferenceDto } from './dto/create-reference.dto';
import { UpdateReferenceDto } from './dto/update-reference.dto';

@Injectable()
export class ReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateReferenceDto) { return this.prisma.reference.create({ data: dto }); }

  findAll() { return this.prisma.reference.findMany({ orderBy: { createdAt: 'desc' } }); }

  async findOne(id: string) {
    const reference = await this.prisma.reference.findUnique({ where: { id } });
    if (!reference) throw new NotFoundException('Reference not found');
    return reference;
  }

  async update(id: string, dto: UpdateReferenceDto) {
    await this.findOne(id);
    return this.prisma.reference.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.reference.delete({ where: { id } });
    return { message: 'Reference deleted successfully' };
  }
}