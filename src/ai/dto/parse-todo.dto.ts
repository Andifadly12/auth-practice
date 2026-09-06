import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ParseTodoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text!: string;
}
