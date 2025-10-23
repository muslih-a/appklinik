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
import { SettingsService } from '../settings/settings.service';
import { Clinic, ClinicDocument } from '../clinics/schemas/clinic.schema';

@Injectable()
export class TasksService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly settingsService: SettingsService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(ScheduledVaccination.name)
    private scheduledVaccinationModel: Model<ScheduledVaccinationDocument>,
    @InjectModel(Clinic.name) private clinicModel: Model<ClinicDocument>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleRealtimeReminders() {
    const settings = await this.settingsService.getSettings();

    if (!settings.isScheduledReminderActive) {
      return;
    }

    const waitingAppointments = await this.appointmentModel
      .find({
        status: 'WAITING',
        isRealtimeReminderSent: false,
      })
      .populate('clinic')
      .populate('patient')
      .sort({ queueNumber: 1 });

    if (waitingAppointments.length === 0) {
      return;
    }
    
    const AVERAGE_CONSULTATION_MINUTES = 15;

    for (const app of waitingAppointments) {
      const clinic = app.clinic as ClinicDocument;
      const patient = app.patient as UserDocument;
      const now = new Date();

      const openingTimeToday = new Date(now.toDateString() + ' ' + clinic.openingTime);
      const calculationStartTime = now > openingTimeToday ? now : openingTimeToday;
      
      const patientsToServe = app.queueNumber - (clinic.nowServing || 0);
      if (patientsToServe < 0) continue;

      const estimatedWaitMinutes = patientsToServe * AVERAGE_CONSULTATION_MINUTES;
      const estimatedStartTime = new Date(
        calculationStartTime.getTime() + estimatedWaitMinutes * 60000,
      );

      const minutesUntilAppointment =
        (estimatedStartTime.getTime() - now.getTime()) / 60000;

      if (
        minutesUntilAppointment <= settings.realtimeReminderThreshold &&
        minutesUntilAppointment > 0
      ) {
        // --- PERBAIKAN ERROR ADA DI DALAM BLOK 'IF' INI ---
        if (patient && patient.fcmToken) {
          // Menggunakan patient.name
          console.log(`Sending realtime reminder to patient ${patient.name}...`);
          
          const timeFormat = new Intl.DateTimeFormat('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta',
          });

          await this.firebaseService.sendPushNotification(
            patient.fcmToken, // Sekarang aman karena sudah dicek
            'Persiapan Giliran Anda',
            `Perkiraan dilayani pukul ${timeFormat.format(estimatedStartTime)}. Mohon bersiap.`,
          );

          await this.appointmentModel.findByIdAndUpdate(app._id, {
            isRealtimeReminderSent: true,
          });
        }
      }
    }
  }

  // --- FUNGSI DI BAWAH INI TIDAK BERUBAH ---

  @Cron(CronExpression.EVERY_MINUTE)
  async handleDailyReminders() {
    const settings = await this.settingsService.getSettings();

    if (!settings.isScheduledReminderActive) {
      return;
    }

    const currentTime = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    });

    if (currentTime === settings.dayHReminderTime) {
      // ... (kode tidak berubah)
    }

    if (currentTime === settings.h1ReminderTime) {
      // ... (kode tidak berubah)
    }
  }

  private async sendAppointmentReminders(date: Date, dayText: string) {
    // ... (kode tidak berubah)
  }

  private async sendVaccinationReminders(date: Date, dayText: string) {
    // ... (kode tidak berubah)
  }
}