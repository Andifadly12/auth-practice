import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChangePasswordDto,
  DeleteAccountDto,
} from './dto/account-security.dto';
import { CreateDtoProfile, UpdateDtoProfile } from './dto/profile.dto';

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

  async getById(id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            umur: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile tidak ditemukan');
    }

    return {
      message: 'Profile berhasil diambil',
      profile,
    };
  }

  async update(id: string, dto: UpdateDtoProfile) {
    await this.getById(id);

    const profile = await this.prisma.profile.update({
      where: { id },
      data: dto,
    });

    return {
      message: 'Profile berhasil diperbarui',
      profile,
    };
  }

  async remove(id: string) {
    await this.getById(id);

    await this.prisma.profile.delete({
      where: { id },
    });

    return {
      message: 'Profile berhasil dihapus',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      !user ||
      !(await bcrypt.compare(dto.currentPassword, user.passwordHash))
    ) {
      throw new UnauthorizedException('Password saat ini salah');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    const revokedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt },
      }),
    ]);

    return { message: 'Password berhasil diubah. Silakan login kembali' };
  }

  async deleteAccount(userId: string, dto: DeleteAccountDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Password salah');
    }

    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Akun berhasil dihapus' };
  }
}
