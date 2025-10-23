import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsPositive,
} from 'class-validator';

export class CreateVaccineDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  minAgeMonths: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAgeMonths?: number;

  @IsNumber()
  @IsPositive()
  dosesRequired: number;

  // --- [PENAMBAHAN] ---
  // Field opsional untuk admin memilih klinik
  @IsOptional()
  @IsString()
  clinicId?: string;
}