import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVaccinationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsDateString()
  dateGiven: string;

  @IsNotEmpty()
  @IsString()
  patientId: string;
  
  @IsNotEmpty()
  @IsString()
  appointmentId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}