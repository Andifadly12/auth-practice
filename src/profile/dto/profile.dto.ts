import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDtoProfile {
  @IsNotEmpty()
  @IsString()
  bio: string;

  @IsNotEmpty()
  @IsString()
  phone: string;
}
