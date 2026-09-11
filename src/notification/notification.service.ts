import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.findOwnedNotification(userId, id);

    if (notification.isRead) return notification;

    return this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      message: 'Semua notifikasi berhasil ditandai sudah dibaca',
      updated: result.count,
    };
  }

  async remove(userId: string, id: string) {
    const notification = await this.findOwnedNotification(userId, id);
    await this.prisma.notification.delete({
      where: { id: notification.id },
    });

    return { message: 'Notifikasi berhasil dihapus' };
  }

  private async findOwnedNotification(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notifikasi tidak ditemukan');
    }

    return notification;
  }
}
