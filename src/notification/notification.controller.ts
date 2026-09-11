import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequestWithUser } from '../auth/interfaces/interficeRequestWithUser';
import { NotificationService } from './notification.service';

@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(@Req() request: RequestWithUser) {
    return this.notificationService.findAll(request.user!.id);
  }

  @Patch('read-all')
  markAllAsRead(@Req() request: RequestWithUser) {
    return this.notificationService.markAllAsRead(request.user!.id);
  }

  @Patch(':id/read')
  markAsRead(
    @Req() request: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.notificationService.markAsRead(request.user!.id, id);
  }

  @Delete(':id')
  remove(
    @Req() request: RequestWithUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.notificationService.remove(request.user!.id, id);
  }
}
