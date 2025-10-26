import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Types } from 'mongoose'; // Import Types

export class CreateAdminKlinikDto {
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @IsNotEmpty({ message: 'ID Klinik tidak boleh kosong' })
  @IsString() // Validasi sebagai string dulu, konversi/cek ObjectId di service
  clinicId: string; // Terima sebagai string dari request
}