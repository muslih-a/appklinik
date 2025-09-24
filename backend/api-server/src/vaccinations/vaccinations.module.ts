import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VaccinationsService } from './vaccinations.service';
import { VaccinationsController } from './vaccinations.controller';
import { Vaccination, VaccinationSchema } from './schemas/vaccination.schema';
// 1. Impor skema Appointment
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vaccination.name, schema: VaccinationSchema },
      // 2. Daftarkan juga skema Appointment di sini
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [VaccinationsController],
  providers: [VaccinationsService],
})
export class VaccinationsModule {}