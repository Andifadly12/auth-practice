import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequestWithUser } from '../auth/interfaces/interficeRequestWithUser';
import { CreateDtoProfile, UpdateDtoProfile } from './dto/profile.dto';
import { ProfileService } from './profile.service';

@UseGuards(AuthGuard('jwt'))
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  getMyProfile(@Req() request: RequestWithUser) {
    return this.profileService.getMyProfile(request.user!.id);
  }

  @Post()
  create(@Req() request: RequestWithUser, @Body() dto: CreateDtoProfile) {
    return this.profileService.create(request.user!.id, dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.profileService.getById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDtoProfile) {
    return this.profileService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profileService.remove(id);
  }
}
