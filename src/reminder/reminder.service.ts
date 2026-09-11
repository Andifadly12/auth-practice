import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processDueReminders(now = new Date()) {
    const todos = await this.prisma.todo.findMany({
      where: {
        reminderAt: { lte: now },
        reminderSentAt: null,
      },
      select: {
        id: true,
        userId: true,
        title: true,
      },
      orderBy: { reminderAt: 'asc' },
      take: 100,
    });

    let sent = 0;

    for (const todo of todos) {
      try {
        const wasSent = await this.createNotification(todo, now);
        if (wasSent) sent += 1;
      } catch (error) {
        this.logger.error(
          `Gagal memproses reminder Todo ${todo.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    if (sent > 0) {
      this.logger.log(`${sent} reminder berhasil dikirim`);
    }

    return { checked: todos.length, sent };
  }

  private async createNotification(
    todo: { id: string; userId: string; title: string },
    sentAt: Date,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.todo.updateMany({
        where: {
          id: todo.id,
          reminderAt: { lte: sentAt },
          reminderSentAt: null,
        },
        data: { reminderSentAt: sentAt },
      });

      if (claimed.count === 0) return false;

      await transaction.notification.create({
        data: {
          userId: todo.userId,
          type: 'TODO_REMINDER',
          title: 'Pengingat Todo',
          message: `Waktunya mengerjakan: ${todo.title}`,
        },
      });

      return true;
    });
  }
}
