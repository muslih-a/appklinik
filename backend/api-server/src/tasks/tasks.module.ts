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

@Module({
  imports: [
    // Beri akses ke koleksi User, Appointment, dan ScheduledVaccination
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: ScheduledVaccination.name, schema: ScheduledVaccinationSchema },
    ]),
  ],
  providers: [TasksService, FirebaseService], // Daftarkan TasksService dan FirebaseService
})
export class TasksModule {}