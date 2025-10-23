import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { FirebaseService } from './firebase.service';
import { User, UserSchema } from '../auth/schemas/user.schema';
import {
  Appointment,
  AppointmentSchema,
} from '../appointments/schemas/appointment.schema';
import {
  ScheduledVaccination,
  ScheduledVaccinationSchema,
} from '../scheduled-vaccinations/schemas/scheduled-vaccination.schema';
import { SettingsModule } from '../settings/settings.module';
// --- 1. Impor Skema Klinik ---
import { Clinic, ClinicSchema } from '../clinics/schemas/clinic.schema';

@Module({
  imports: [
    SettingsModule,
    
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: ScheduledVaccination.name, schema: ScheduledVaccinationSchema },
      // --- 2. Daftarkan Model Klinik di sini ---
      { name: Clinic.name, schema: ClinicSchema },
    ]),
  ],
  providers: [TasksService, FirebaseService],
})
export class TasksModule {}