import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { jwtConstants } from './constants';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface RefreshTokenPayload {
  sub: string;
  jti: string;
  tokenType: 'refresh';
}

const REFRESH_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

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
        role: dto.role,
      },
      select: {
        id: true,
        username: true,
        umur: true,
        name: true,
        email: true,
        role: true,
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
    const tokens = await this.issueTokens({
      id: axestingEmail.id,
      email: axestingEmail.email,
      role: axestingEmail.role,
    });

    return {
      message: 'login berhasil ',
      ...tokens,
      axestingEmail: {
        id: axestingEmail.id,
        name: axestingEmail.name,
        email: axestingEmail.email,
      },
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.userId !== payload.sub ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date() ||
      storedToken.tokenHash !== this.hashToken(refreshToken)
    ) {
      throw new UnauthorizedException('Refresh token tidak valid');
    }

    const newToken = await this.createRefreshToken(storedToken.userId);
    const revokedAt = new Date();
    await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          userId: storedToken.userId,
          tokenHash: storedToken.tokenHash,
          revokedAt: null,
          expiresAt: { gt: revokedAt },
        },
        data: { revokedAt },
      });

      if (result.count === 0) {
        throw new UnauthorizedException('Refresh token tidak valid');
      }

      await transaction.refreshToken.create({ data: newToken.record });
    });

    const accessToken = await this.signAccessToken(storedToken.user);

    return {
      message: 'Token berhasil diperbarui',
      accessToken,
      refreshToken: newToken.value,
    };
  }

  async logout(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        id: payload.jti,
        userId: payload.sub,
        tokenHash: this.hashToken(refreshToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    if (result.count === 0) {
      throw new UnauthorizedException('Refresh token tidak valid');
    }

    return { message: 'Logout berhasil' };
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Logout dari semua perangkat berhasil' };
  }

  private async issueTokens(user: { id: string; email: string; role: string }) {
    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    await this.prisma.refreshToken.create({ data: refreshToken.record });

    return { accessToken, refreshToken: refreshToken.value };
  }

  private signAccessToken(user: { id: string; email: string; role: string }) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType: 'access',
    });
  }

  private async createRefreshToken(userId: string) {
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS);
    const value = await this.jwtService.signAsync(
      { sub: userId, jti: id, tokenType: 'refresh' },
      { secret: jwtConstants.refreshSecret, expiresIn: '7d' },
    );

    return {
      value,
      record: {
        id,
        userId,
        tokenHash: this.hashToken(value),
        expiresAt,
      },
    };
  }

  private async verifyRefreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        token,
        { secret: jwtConstants.refreshSecret },
      );

      if (payload.tokenType !== 'refresh' || !payload.sub || !payload.jti) {
        throw new Error('Invalid refresh token payload');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid');
    }
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
