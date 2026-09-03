import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDtoProfile } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        username: true,
        umur: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            bio: true,
            phone: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('penggguna tidak aditemukan ');
    }
    return {
      message: 'Profile hasil diambil',
      profile: user,
    };
  }

  async create(userId: string, dto: CreateDtoProfile) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('pengguna tidak ada');
    }

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        bio: dto.bio,
        phone: dto.phone,
      },
      update: {
        bio: dto.bio,
        phone: dto.phone,
      },
    });

    return {
      message: 'Profile berhasil disimpan',
      profile,
    };
  }
}
