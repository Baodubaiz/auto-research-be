import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { REDIS_CLIENT } from '../../../common/messaging.tokens';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PublicUser, UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const userName = dto.userName.trim();
    const existingUser = await this.usersService.existsByEmailOrUserName(
      email,
      userName,
    );

    if (existingUser) {
      throw new ConflictException('Email or username is already in use');
    }

    const user = await this.usersService.create({
      email,
      userName,
      password: dto.password,
      fullName: dto.fullName?.trim() || null,
    });

    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();
    const user = await this.usersService.findByEmailOrUserName(identifier);

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createAuthResponse({
      id: user.id,
      email: user.email,
      userName: user.userName,
      fullName: user.fullName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async logout(jti: string, exp: number) {
    if (!this.configService.get<boolean>('redis.enabled', false)) {
      return { message: 'Logged out successfully' };
    }

    const ttl = Math.max(1, exp - Math.floor(Date.now() / 1000));
    await this.redis.set(`revoked-token:${jti}`, '1', 'EX', ttl);
    return { message: 'Logged out successfully' };
  }

  private async createAuthResponse(user: PublicUser) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      userName: user.userName,
      jti: randomUUID(),
    });

    return { accessToken, user };
  }
}
