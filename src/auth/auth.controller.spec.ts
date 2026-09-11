import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();
    controller = module.get(AuthController);
  });

  it('meneruskan permintaan forgot password ke service', async () => {
    const dto = { email: 'user@example.com' };
    authService.forgotPassword.mockResolvedValue({ message: 'ok' });

    await expect(controller.forgotPassword(dto)).resolves.toEqual({
      message: 'ok',
    });
    expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
  });

  it('meneruskan token reset password ke service', async () => {
    const dto = { token: 'token', newPassword: 'Password123!' };
    authService.resetPassword.mockResolvedValue({ message: 'reset' });

    await expect(controller.resetPassword(dto)).resolves.toEqual({
      message: 'reset',
    });
    expect(authService.resetPassword).toHaveBeenCalledWith(dto);
  });
});
