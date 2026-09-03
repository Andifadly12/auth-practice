import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../generated/prisma/enums';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(20, { message: 'Username must be at most 20 characters long' })
  username!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  umur!: number;

  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsNotEmpty()
  @IsEnum(UserRole, { message: 'Role harus berupa USER atau ADMIN' })
  role!: UserRole;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password must be at most 100 characters long' })
  password!: string;
}
