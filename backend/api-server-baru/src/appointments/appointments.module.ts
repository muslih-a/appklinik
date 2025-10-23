import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import {
  ScheduledVaccination,
  ScheduledVaccinationSchema,
} from '../scheduled-vaccinations/schemas/scheduled-vaccination.schema';
import { Clinic, ClinicSchema } from '../clinics/schemas/clinic.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: ScheduledVaccination.name, schema: ScheduledVaccinationSchema },
      { name: Clinic.name, schema: ClinicSchema },
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}