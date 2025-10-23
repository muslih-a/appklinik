import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { ClinicsModule } from './clinics/clinics.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { EventsModule } from './events/events.module';
import { ScheduledVaccinationsModule } from './scheduled-vaccinations/scheduled-vaccinations.module';
import { VaccinesModule } from './vaccines/vaccines.module';
import { SettingsModule } from './settings/settings.module';
import { TasksModule } from './tasks/tasks.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DoctorsModule } from './doctors/doctors.module';
// --- 1. Impor PatientsModule ---
import { PatientsModule } from './patients/patients.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ClinicsModule,
    AppointmentsModule,
    EventsModule,
    ScheduledVaccinationsModule,
    VaccinesModule,
    SettingsModule,
    TasksModule,
    ReportsModule,
    DashboardModule,
    DoctorsModule,
    // --- 2. Daftarkan PatientsModule di sini ---
    PatientsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}