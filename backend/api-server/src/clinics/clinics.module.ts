import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicsController } from './clinics.controller';
import { ClinicsService } from './clinics.service';
import { Clinic, ClinicSchema } from './schemas/clinic.schema';
// --- 1. Impor skema User ---
import { User, UserSchema } from '../auth/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Clinic.name, schema: ClinicSchema },
      // --- 2. Tambahkan User model di sini ---
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ClinicsController],
  providers: [ClinicsService],
})
export class ClinicsModule {}