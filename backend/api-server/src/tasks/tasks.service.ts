import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FirebaseService } from './firebase.service';
import { User, UserDocument } from '../auth/schemas/user.schema';
import {
  Appointment,
  AppointmentDocument,
} from '../appointments/schemas/appointment.schema';
import {
  ScheduledVaccination,
  ScheduledVaccinationDocument,
} from '../scheduled-vaccinations/schemas/scheduled-vaccination.schema';

@Injectable()
export class TasksService {
  constructor(
    private readonly firebaseService: FirebaseService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(ScheduledVaccination.name)
    private scheduledVaccinationModel: Model<ScheduledVaccinationDocument>,
  ) {}

  // Cron job ini berjalan setiap menit untuk keperluan testing.
  // Nanti kita akan ubah menjadi CronExpression.EVERY_DAY_AT_7AM untuk production.
  @Cron(CronExpression.EVERY_MINUTE)
  async handleDailyReminders() {
    console.log('Running daily reminder task...');

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    // --- Pengingat Janji Temu ---
    await this.sendAppointmentReminders(today, 'Hari Ini');
    await this.sendAppointmentReminders(tomorrow, 'Besok');

    // --- Pengingat Jadwal Vaksinasi ---
    await this.sendVaccinationReminders(today, 'Hari Ini');
    await this.sendVaccinationReminders(tomorrow, 'Besok');
  }

  private async sendAppointmentReminders(date: Date, dayText: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.appointmentModel
      .find({
        appointmentTime: { $gte: startOfDay, $lte: endOfDay },
        status: 'SCHEDULED',
      })
      .populate('patient'); // Ambil data pasien

    for (const app of appointments) {
      const patient = app.patient as UserDocument;
      if (patient && patient.fcmToken) {
        const time = new Date(app.appointmentTime).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });
        await this.firebaseService.sendPushNotification(
          patient.fcmToken,
          `Pengingat Janji Temu ${dayText}`,
          `Anda memiliki janji temu pada pukul ${time}.`,
        );
      }
    }
  }

  private async sendVaccinationReminders(date: Date, dayText: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const schedules = await this.scheduledVaccinationModel
      .find({
        scheduledDate: { $gte: startOfDay, $lte: endOfDay },
        status: 'SCHEDULED',
      })
      .populate('patient');

    for (const schedule of schedules) {
      const patient = schedule.patient as UserDocument;
      if (patient && patient.fcmToken) {
        await this.firebaseService.sendPushNotification(
          patient.fcmToken,
          `Pengingat Vaksinasi ${dayText}`,
          `Anda memiliki jadwal untuk vaksin ${schedule.vaccineName}.`,
        );
      }
    }
  }
}