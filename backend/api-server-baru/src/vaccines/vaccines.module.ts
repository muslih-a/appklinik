import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VaccinesController } from './vaccines.controller';
import { VaccinesService } from './vaccines.service';
import { Vaccine, VaccineSchema } from './schemas/vaccine.schema';
import { AuthModule } from '../auth/auth.module';

// 1. Impor User model dan schema
import { User, UserSchema } from '../auth/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vaccine.name, schema: VaccineSchema },
      // 2. Daftarkan UserModel di sini
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [VaccinesController],
  providers: [VaccinesService],
})
export class VaccinesModule {}