import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';

export class UpdateSettingDto {
  @IsOptional()
  @IsBoolean()
  isScheduledReminderActive?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:MM format',
  })
  h1ReminderTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:MM format',
  })
  dayHReminderTime?: string;

  // --- FIELD BARU DITAMBAHKAN DI SINI ---
  @IsOptional()
  @IsNumber()
  @IsPositive()
  realtimeReminderThreshold?: number;
}