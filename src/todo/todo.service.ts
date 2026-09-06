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

  async create(userId: string, dto: CreateTodoDto) {
    await this.validateCategory(userId, dto.categoryId);
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

  async findAll(userId: string, filter: FilterTodoDto) {
    this.validateCompletedFilter(filter);

    const where: Prisma.TodoWhereInput = {
      userId,
      ...(filter.title && {
        title: { contains: filter.title, mode: 'insensitive' },
      }),
      ...(filter.priority && { priority: filter.priority }),
      ...(filter.status && { status: filter.status }),
    };

    if (filter.completed !== undefined && !filter.status) {
      where.status = filter.completed
        ? TodoStatus.COMPLETED
        : { not: TodoStatus.COMPLETED };
    }

    const skip = (filter.page - 1) * filter.limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.todo.findMany({
        where,
        orderBy: [{ title: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: filter.limit,
      }),
      this.prisma.todo.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: filter.page,
        limit: filter.limit,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
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
    await this.validateCategory(userId, dto.categoryId);

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

  private async validateCategory(userId: string, categoryId?: string | null) {
    if (categoryId == null) return;
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException(
        'Kategori tidak ditemukan atau bukan milik Anda',
      );
    }
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
