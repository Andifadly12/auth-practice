import { Test, TestingModule } from '@nestjs/testing';
import { RequestWithUser } from '../auth/interfaces/interficeRequestWithUser';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoController } from './todo.controller';
import { TodoService } from './todo.service';

describe('TodoController', () => {
  let controller: TodoController;

  const todoService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const request = {
    user: {
      id: 'user-id',
      email: 'user@example.com',
      role: 'USER',
    },
  } as RequestWithUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [{ provide: TodoService, useValue: todoService }],
    }).compile();

    controller = module.get<TodoController>(TodoController);
    jest.clearAllMocks();
  });

  it('meneruskan user dan data saat membuat todo', async () => {
    const dto: CreateTodoDto = { title: 'Belajar NestJS' };

    await controller.create(request, dto);

    expect(todoService.create).toHaveBeenCalledWith('user-id', dto);
  });

  it('mengambil semua todo milik user', async () => {
    await controller.findAll(request);

    expect(todoService.findAll).toHaveBeenCalledWith('user-id');
  });

  it('mengambil satu todo milik user berdasarkan id', async () => {
    await controller.findOne(request, 'todo-id');

    expect(todoService.findOne).toHaveBeenCalledWith('user-id', 'todo-id');
  });

  it('memperbarui todo milik user', async () => {
    const dto: UpdateTodoDto = { title: 'Belajar Prisma' };

    await controller.update(request, 'todo-id', dto);

    expect(todoService.update).toHaveBeenCalledWith('user-id', 'todo-id', dto);
  });

  it('menghapus todo milik user', async () => {
    await controller.remove(request, 'todo-id');

    expect(todoService.remove).toHaveBeenCalledWith('user-id', 'todo-id');
  });
});
