import { Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { TodoPriority, TodoStatus } from '../../../generated/prisma/client';

function parseBoolean(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export class FilterTodoDto {
  @IsOptional()
  @IsEnum(TodoPriority)
  priority?: TodoPriority;

  @IsOptional()
  @IsEnum(TodoStatus)
  status?: TodoStatus;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) => parseBoolean(value))
  @IsBoolean()
  completed?: boolean;
}
