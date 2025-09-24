import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateScheduledVaccinationDto {
  @IsNotEmpty()
  @IsString()
  vaccineName: string;

  @IsNotEmpty()
  @IsDateString()
  scheduledDate: string;

  @IsNotEmpty()
  @IsString()
  patientId: string;
}