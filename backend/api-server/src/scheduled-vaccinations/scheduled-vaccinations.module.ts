import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduledVaccinationsService } from './scheduled-vaccinations.service';
import { ScheduledVaccinationsController } from './scheduled-vaccinations.controller';
import {
  ScheduledVaccination,
  ScheduledVaccinationSchema,
} from './schemas/scheduled-vaccination.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScheduledVaccination.name, schema: ScheduledVaccinationSchema },
    ]),
  ],
  controllers: [ScheduledVaccinationsController],
  providers: [ScheduledVaccinationsService],
})
export class ScheduledVaccinationsModule {}