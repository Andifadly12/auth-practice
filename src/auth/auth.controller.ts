import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequestWithUser } from './interfaces/interficeRequestWithUser';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authServices: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authServices.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authServices.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authServices.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(@Body() dto: RefreshTokenDto) {
    return this.authServices.logout(dto.refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout-all')
  logoutAll(@Req() request: RequestWithUser) {
    return this.authServices.logoutAll(request.user!.id);
  }
}
