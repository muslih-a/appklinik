import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Pastikan MongooseModule diimpor
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import {
  ScheduledVaccination,
  ScheduledVaccinationSchema,
} from '../scheduled-vaccinations/schemas/scheduled-vaccination.schema';
import { Clinic, ClinicSchema } from '../clinics/schemas/clinic.schema';
// --- [TAMBAHKAN IMPOR INI] ---
import { User, UserSchema } from '../auth/schemas/user.schema';
// -----------------------------

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: ScheduledVaccination.name, schema: ScheduledVaccinationSchema },
      { name: Clinic.name, schema: ClinicSchema },
      // --- [TAMBAHKAN BARIS INI] ---
      { name: User.name, schema: UserSchema }, // Daftarkan UserSchema di sini
      // -----------------------------
    ]),
    // Impor module lain jika perlu (misal NotificationsModule jika tidak global)
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService], // Export jika service ini dipakai module lain
})
export class AppointmentsModule {}