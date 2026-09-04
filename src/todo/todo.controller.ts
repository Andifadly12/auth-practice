import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequestWithUser } from '../auth/interfaces/interficeRequestWithUser';
import { CreateTodoDto } from './dto/create-todo.dto';
import { FilterTodoDto } from './dto/filter-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoService } from './todo.service';

@UseGuards(AuthGuard('jwt'))
@Controller('todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  create(@Req() request: RequestWithUser, @Body() dto: CreateTodoDto) {
    return this.todoService.create(request.user!.id, dto);
  }

  @Get()
  findAll(@Req() request: RequestWithUser, @Query() filter: FilterTodoDto) {
    return this.todoService.findAll(request.user!.id, filter);
  }

  @Get(':id')
  findOne(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.todoService.findOne(request.user!.id, id);
  }

  @Patch(':id')
  update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto,
  ) {
    return this.todoService.update(request.user!.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.todoService.remove(request.user!.id, id);
  }
}
