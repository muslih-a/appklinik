import { IsOptional, IsString } from 'class-validator';

export class RecordEmrDto {
  @IsOptional()
  @IsString()
  symptoms?: string; // Diganti dari 'notes'

  @IsOptional()
  @IsString()
  diagnosis?: string; // Tetap

  @IsOptional()
  @IsString()
  treatment?: string; // Diganti dari 'prescription'
}