import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReminderService } from './reminder.service';

@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(private readonly reminderService: ReminderService) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'todo-reminder',
    waitForCompletion: true,
  })
  async checkDueReminders() {
    this.logger.debug('Memeriksa reminder Todo yang sudah jatuh tempo');
    await this.reminderService.processDueReminders();
  }
}
