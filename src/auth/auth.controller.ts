import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
}
