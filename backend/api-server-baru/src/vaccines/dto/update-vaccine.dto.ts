import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsPositive,
} from 'class-validator';

// DTO untuk update mirip dengan create, tapi semua field bersifat opsional
export class UpdateVaccineDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAgeMonths?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAgeMonths?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  dosesRequired?: number;
}