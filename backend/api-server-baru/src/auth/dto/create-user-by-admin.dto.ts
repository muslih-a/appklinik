import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class CreateUserByAdminDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  password: string;
  
  @IsOptional()
  @IsString()
  clinicId?: string;
  
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @IsNotEmpty()
  @IsEnum(['Admin', 'Doctor', 'Patient']) // Memastikan role yang dimasukkan valid
  role: string; 
}