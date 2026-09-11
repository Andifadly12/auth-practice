import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { jwtConstants } from './constants';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ResendVerificationDto,
  VerifyEmailDto,
} from './dto/account-recovery.dto';

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

    const verificationToken = await this.issueAccountToken(
      user.id,
      'EMAIL_VERIFICATION',
      24 * 60 * 60 * 1000,
    );

    return {
      message: 'Register berhasil',
      user,
      ...this.developmentToken('verificationToken', verificationToken),
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    let resetToken: string | undefined;

    if (user) {
      resetToken = await this.issueAccountToken(
        user.id,
        'RESET_PASSWORD',
        60 * 60 * 1000,
      );
    }

    return {
      message: 'Jika email terdaftar, instruksi reset password telah dibuat',
      ...(resetToken ? this.developmentToken('resetToken', resetToken) : {}),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const token = await this.findValidAccountToken(dto.token, 'RESET_PASSWORD');
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    const usedAt = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: token.userId },
        data: { passwordHash },
      }),
      this.prisma.accountToken.update({
        where: { id: token.id },
        data: { usedAt },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: usedAt },
      }),
    ]);

    return { message: 'Password berhasil direset' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const token = await this.findValidAccountToken(
      dto.token,
      'EMAIL_VERIFICATION',
    );
    const usedAt = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: token.userId },
        data: { emailVerifiedAt: usedAt },
      }),
      this.prisma.accountToken.update({
        where: { id: token.id },
        data: { usedAt },
      }),
    ]);

    return { message: 'Email berhasil diverifikasi' };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, emailVerifiedAt: true },
    });
    let verificationToken: string | undefined;

    if (user && !user.emailVerifiedAt) {
      verificationToken = await this.issueAccountToken(
        user.id,
        'EMAIL_VERIFICATION',
        24 * 60 * 60 * 1000,
      );
    }

    return {
      message: 'Jika email memenuhi syarat, token verifikasi telah dibuat',
      ...(verificationToken
        ? this.developmentToken('verificationToken', verificationToken)
        : {}),
    };
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

  private async issueAccountToken(
    userId: string,
    type: 'RESET_PASSWORD' | 'EMAIL_VERIFICATION',
    lifetimeMs: number,
  ) {
    const value = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(value);

    await this.prisma.$transaction([
      this.prisma.accountToken.deleteMany({
        where: { userId, type, usedAt: null },
      }),
      this.prisma.accountToken.create({
        data: {
          userId,
          type,
          tokenHash,
          expiresAt: new Date(Date.now() + lifetimeMs),
        },
      }),
    ]);

    return value;
  }

  private async findValidAccountToken(
    value: string,
    type: 'RESET_PASSWORD' | 'EMAIL_VERIFICATION',
  ) {
    const token = await this.prisma.accountToken.findFirst({
      where: {
        tokenHash: this.hashToken(value),
        type,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!token) {
      throw new BadRequestException('Token tidak valid atau kedaluwarsa');
    }

    return token;
  }

  private developmentToken(key: string, value: string) {
    return process.env.NODE_ENV === 'production' ? {} : { [key]: value };
  }
}
