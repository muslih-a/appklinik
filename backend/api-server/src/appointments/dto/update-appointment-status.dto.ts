import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @IsNotEmpty()
  @IsEnum([
    'SCHEDULED',
    'WAITING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'SKIPPED',
  ])
  status: string;
}