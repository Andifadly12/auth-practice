import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AskAiDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message!: string;
}
