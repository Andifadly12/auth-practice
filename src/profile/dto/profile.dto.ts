import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDtoProfile {
  @IsNotEmpty()
  @IsString()
  bio: string;

  @IsNotEmpty()
  @IsString()
  phone: string;
}

export class UpdateDtoProfile {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bio?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;
}
