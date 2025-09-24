import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import { EventsGateway } from '../events/events.gateway';
// --- 1. Impor skema dengan nama yang BENAR ---
import {
  ScheduledVaccination,
  ScheduledVaccinationSchema,
} from '../scheduled-vaccinations/schemas/scheduled-vaccination.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      // --- 2. Tambahkan model baru di sini ---
      { name: ScheduledVaccination.name, schema: ScheduledVaccinationSchema },
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, EventsGateway],
})
export class AppointmentsModule {}