import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TodoStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { FilterTodoDto } from './dto/filter-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

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

  findAll(userId: string, filter: FilterTodoDto) {
    this.validateCompletedFilter(filter);

    const where: Prisma.TodoWhereInput = {
      userId,
      ...(filter.priority && { priority: filter.priority }),
      ...(filter.status && { status: filter.status }),
    };

    if (filter.completed !== undefined && !filter.status) {
      where.status = filter.completed
        ? TodoStatus.COMPLETED
        : { not: TodoStatus.COMPLETED };
    }

    return this.prisma.todo.findMany({
      where,
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

  private validateCompletedFilter(filter: FilterTodoDto) {
    if (filter.completed === undefined || !filter.status) return;

    const statusIsCompleted = filter.status === TodoStatus.COMPLETED;

    if (filter.completed !== statusIsCompleted) {
      throw new BadRequestException(
        'Filter status dan completed saling bertentangan',
      );
    }
  }
}
