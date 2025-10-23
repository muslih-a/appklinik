// src/clinics/dto/schedule-closing.dto.ts
import { IsDateString } from 'class-validator';

export class ScheduleClosingDto {
  @IsDateString()
  closeTime: Date;
}