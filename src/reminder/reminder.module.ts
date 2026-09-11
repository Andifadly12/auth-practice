import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import { ReminderService } from './reminder.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  providers: [ReminderService, ReminderSchedulerService],
  exports: [ReminderService],
})
export class ReminderModule {}
