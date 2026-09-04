import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoStatus } from '../../generated/prisma/client';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateTodoDto) {
    const completedAt =
      dto.status === TodoStatus.COMPLETED && !dto.completedAt
        ? new Date()
        : dto.completedAt;

    return this.prisma.todo.create({
      data: {
        ...dto,
        ...(completedAt !== undefined && { completedAt }),
        userId,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId },
    });

    if (!todo) {
      throw new NotFoundException('Todo tidak ditemukan');
    }

    return todo;
  }

  async update(userId: string, id: string, dto: UpdateTodoDto) {
    await this.findOne(userId, id);

    let completedAt: string | Date | null | undefined = dto.completedAt;

    if (dto.status === TodoStatus.COMPLETED && !dto.completedAt) {
      completedAt = new Date();
    } else if (dto.status && dto.status !== TodoStatus.COMPLETED) {
      completedAt = null;
    }

    return this.prisma.todo.update({
      where: { id },
      data: {
        ...dto,
        ...(completedAt !== undefined && { completedAt }),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.todo.delete({ where: { id } });

    return { message: 'Todo berhasil dihapus' };
  }
}
