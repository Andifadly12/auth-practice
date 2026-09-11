import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDtoProfile {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  bio: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  phone: string;
}

export class UpdateDtoProfile {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone?: string;
}
