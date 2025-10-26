import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateAdminKlinikDto {
  @IsOptional() // Nama opsional untuk diupdate
  @IsNotEmpty({ message: 'Nama tidak boleh kosong jika diisi' })
  @IsString()
  name?: string;

  @IsOptional() // Password opsional (hanya jika ingin reset)
  @MinLength(6, { message: 'Password baru minimal 6 karakter' })
  password?: string;

  @IsOptional() // Clinic ID opsional untuk diupdate
  @IsNotEmpty({ message: 'ID Klinik tidak boleh kosong jika diisi' })
  @IsString()
  clinicId?: string; // Terima sebagai string, validasi ObjectId di service
}