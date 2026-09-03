import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateTodoDto) {
    return this.prisma.todo.create({
      data: { ...dto, userId },
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

    return this.prisma.todo.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.todo.delete({ where: { id } });

    return { message: 'Todo berhasil dihapus' };
  }
}
