import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto) {
    await this.ensureNameIsAvailable(userId, dto.name);

    return this.prisma.category.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan');
    }

    return category;
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    await this.findOne(userId, id);

    if (dto.name) {
      await this.ensureNameIsAvailable(userId, dto.name, id);
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.category.delete({ where: { id } });

    return { message: 'Kategori berhasil dihapus' };
  }

  private async ensureNameIsAvailable(
    userId: string,
    name: string,
    excludedId?: string,
  ) {
    const category = await this.prisma.category.findFirst({
      where: {
        userId,
        name,
        ...(excludedId && { id: { not: excludedId } }),
      },
      select: { id: true },
    });

    if (category) {
      throw new ConflictException('Nama kategori sudah digunakan');
    }
  }
}
