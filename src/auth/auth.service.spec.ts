import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: { findUnique: jest.fn() },
    refreshToken: { updateMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('tidak membocorkan apakah email forgot password terdaftar', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.forgotPassword({ email: 'unknown@example.com' }),
    ).resolves.toEqual({
      message: 'Jika email terdaftar, instruksi reset password telah dibuat',
    });
  });

  it('mencabut semua refresh token aktif', async () => {
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

    await expect(service.logoutAll('user-id')).resolves.toEqual({
      message: 'Logout dari semua perangkat berhasil',
    });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledTimes(1);
  });
});
