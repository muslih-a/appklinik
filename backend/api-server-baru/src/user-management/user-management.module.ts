import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserManagementService } from './user-management.service';
import { UserManagementController } from './user-management.controller';
import { User, UserSchema } from '../auth/schemas/user.schema'; // Import User Schema
import { Clinic, ClinicSchema } from '../clinics/schemas/clinic.schema'; // Import Clinic Schema

@Module({
  imports: [
    // Import Mongoose models yang dibutuhkan
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Clinic.name, schema: ClinicSchema },
    ]),
    // Jika butuh service lain (misal AuthModule untuk hash password?), impor di sini
  ],
  controllers: [UserManagementController],
  providers: [UserManagementService],
})
export class UserManagementModule {}