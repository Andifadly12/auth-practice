import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        umur: dto.umur,
        email: dto.email,
        name: dto.username,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        umur: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return {
      message: 'Register berhasil',
      user,
    };
  }

  async login(dto: LoginDto) {
    const axestingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!axestingEmail) {
      throw new UnauthorizedException('email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      axestingEmail.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('email atau password salah');
    }
    const accessToken = await this.jwtService.signAsync({
      sub: axestingEmail.id,
      email: axestingEmail.email,
    });

    return {
      message: 'login berhasil ',
      accessToken,
      axestingEmail: {
        id: axestingEmail.id,
        name: axestingEmail.name,
        email: axestingEmail.email,
      },
    };
  }
}
