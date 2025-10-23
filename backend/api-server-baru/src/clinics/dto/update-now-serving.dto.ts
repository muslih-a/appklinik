import { IsNumber, IsPositive } from 'class-validator';

export class UpdateNowServingDto {
  @IsNumber()
  @IsPositive()
  queueNumber: number;
}