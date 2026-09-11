import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../database/prisma.service';

const publicUserSelect = {
  id: true,
  email: true,
  userName: true,
  fullName: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type UserWithPassword = User;
export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmailOrUserName(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { userName: identifier },
        ],
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: publicUserSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async existsByEmailOrUserName(email: string, userName: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { userName }],
      },
      select: { id: true },
    });
  }

  async create(data: {
    email: string;
    userName: string;
    password: string;
    fullName: string | null;
  }) {
    const existingUser = await this.existsByEmailOrUserName(
      data.email,
      data.userName,
    );

    if (existingUser) {
      throw new ConflictException('Email or username is already in use');
    }

    const user = await this.prisma.user.create({
      data: { ...data, password: await bcrypt.hash(data.password, 12) },
      select: publicUserSelect,
    });

    return user;
  }

  async update(
    id: string,
    data: { email?: string; userName?: string; fullName?: string },
  ) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          data.email ? { email: data.email } : undefined,
          data.userName ? { userName: data.userName } : undefined,
        ].filter(Boolean) as Prisma.UserWhereInput[],
        NOT: { id },
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email or username is already in use');
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: publicUserSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.user.delete({ where: { id } });
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.prisma.user.update({
      where: { id },
      data: { password: await bcrypt.hash(newPassword, 12) },
    });

    return { message: 'Password changed successfully' };
  }
}