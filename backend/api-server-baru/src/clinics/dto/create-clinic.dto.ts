import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateClinicDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  operatingHours?: string;

  // --- TAMBAHAN BARU UNTUK ESTIMASI WAKTU ---
  @IsOptional()
  @IsNumber()
  averageConsultationTime?: number;
}