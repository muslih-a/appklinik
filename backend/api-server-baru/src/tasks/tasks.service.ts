import { Injectable, Logger } from '@nestjs/common'; // <-- Tambahkan Logger
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
  // <-- Tambahkan Logger -->
  private readonly logger = new Logger(TasksService.name);

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

    // --- [PERUBAHAN DI SINI] ---
    // Populate dokter juga untuk mendapatkan nowServingDoctor
    const waitingAppointments = await this.appointmentModel
      .find({
        status: 'WAITING',
        isRealtimeReminderSent: false, // Hanya yang belum dikirim pengingat
        // Tambahkan filter waktu jika perlu (misal janji temu hari ini saja)
      })
      .populate<{ clinic: ClinicDocument }>('clinic') // Populate klinik
      .populate<{ patient: UserDocument }>('patient') // Populate pasien
      .populate<{ doctor: UserDocument }>({ // Populate dokter
           path: 'doctor',
           select: 'nowServingDoctor' // Pilih field nowServingDoctor
      })
      .sort({ queueNumber: 1 })
      .exec(); // Gunakan exec()
    // --------------------------

    if (waitingAppointments.length === 0) {
      return;
    }

    // Ambil average consultation time default atau dari setting jika ada
    const AVERAGE_CONSULTATION_MINUTES = 15; // Atau ambil dari clinic.averageConsultationTime

    for (const app of waitingAppointments) {
      // Pastikan hasil populate tidak null
      const clinic = app.clinic as ClinicDocument | null;
      const patient = app.patient as UserDocument | null;
      const doctor = app.doctor as UserDocument | null; // Ambil data dokter

      // Lewati jika data penting tidak ada
      if (!clinic || !patient || !doctor) {
        this.logger.warn(`Data tidak lengkap untuk appointment ${app._id}, reminder dilewati.`);
        continue;
      }

      const now = new Date();

      // Hitung waktu buka hari ini
      const [openHours, openMinutes] = (clinic.openingTime ?? '08:00').split(':').map(Number);
      const openingTimeToday = new Date();
      openingTimeToday.setHours(openHours, openMinutes, 0, 0);
      // Gunakan waktu sekarang atau waktu buka, mana yg lebih akhir
      const calculationStartTime = now > openingTimeToday ? now : openingTimeToday;

      // --- [PERUBAHAN DI SINI] ---
      // Gunakan nowServingDoctor dari dokter
      const nowServingNumber = doctor.nowServingDoctor ?? 0;
      // --------------------------

      // Hitung jumlah pasien di depan (minimal 0)
      // Perhitungan mungkin perlu disesuaikan jika ingin menghitung pasien WAITING lain di depan
      // Untuk reminder, mungkin lebih sederhana: queueNumber - nowServingDoctor
      const patientsAhead = Math.max(0, app.queueNumber - nowServingNumber - 1); // Pasien *sebelum* antrian ini

      // Estimasi waktu tunggu (gunakan average time dari klinik jika ada)
      const avgTime = clinic.averageConsultationTime || AVERAGE_CONSULTATION_MINUTES;
      const estimatedWaitMinutes = patientsAhead * avgTime;
      const estimatedStartTime = new Date(
        calculationStartTime.getTime() + estimatedWaitMinutes * 60000,
      );

      // Hitung menit sampai estimasi waktu mulai
      const minutesUntilAppointment =
        (estimatedStartTime.getTime() - now.getTime()) / 60000;

      // Cek apakah masuk dalam threshold reminder
      if (
        minutesUntilAppointment <= settings.realtimeReminderThreshold &&
        minutesUntilAppointment > 0 // Hanya jika belum lewat
      ) {
        // Cek fcmToken pasien (fcmToken atau expoPushToken?)
        if (patient.fcmToken || patient.expoPushToken) {
          const targetToken = patient.fcmToken || patient.expoPushToken; // Prioritaskan salah satu
          this.logger.log(`Mengirim realtime reminder ke pasien ${patient.name} (Token: ${targetToken})...`);

          const timeFormat = new Intl.DateTimeFormat('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta', // Pastikan timezone benar
          });

          try {
            await this.firebaseService.sendPushNotification( // Pastikan service ini masih relevan
              targetToken!, // Tanda ! karena sudah dicek
              'Persiapan Giliran Anda',
              `Perkiraan dilayani pukul ${timeFormat.format(estimatedStartTime)} WIB. Mohon bersiap.`,
              // Tambahkan data payload jika perlu
              // { appointmentId: app._id.toString(), type: 'REALTIME_REMINDER' }
            );

            // Tandai reminder sudah terkirim
            await this.appointmentModel.findByIdAndUpdate(app._id, {
              isRealtimeReminderSent: true,
            });
            this.logger.log(`Realtime reminder berhasil dikirim ke ${patient.name}.`);

          } catch (error) {
             this.logger.error(`Gagal mengirim realtime reminder ke ${patient.name}:`, error);
             // Handle error, misal jika token tidak valid
          }
        } else {
           this.logger.warn(`Token notifikasi tidak ditemukan untuk pasien ${patient.name} (${patient._id}), reminder dilewati.`);
           // Tandai juga agar tidak dicoba terus? Tergantung logika bisnis.
           // await this.appointmentModel.findByIdAndUpdate(app._id, { isRealtimeReminderSent: true });
        }
      }
    }
  }

  // --- Fungsi Lain (handleDailyReminders, sendAppointmentReminders, sendVaccinationReminders) TIDAK BERUBAH ---
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

    // Sesuaikan logika waktu ini jika perlu
    if (currentTime === settings.dayHReminderTime) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      await this.sendAppointmentReminders(today, 'hari ini');
      await this.sendVaccinationReminders(today, 'hari ini');
    }

    if (currentTime === settings.h1ReminderTime) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      await this.sendAppointmentReminders(tomorrow, 'besok');
      await this.sendVaccinationReminders(tomorrow, 'besok');
    }
  }

  private async sendAppointmentReminders(date: Date, dayText: string) {
     const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
     const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

     const appointments = await this.appointmentModel.find({
        appointmentTime: { $gte: startOfDay, $lte: endOfDay },
        status: 'SCHEDULED', // Hanya yang masih dijadwalkan
        // Tambahkan filter 'isReminderSent' jika ada
     }).populate<{ patient: UserDocument }>('patient').populate<{ clinic: ClinicDocument}>('clinic');

     const timeFormat = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

     for (const app of appointments) {
        const patient = app.patient;
        const clinic = app.clinic;
        if (patient && (patient.fcmToken || patient.expoPushToken) && clinic) {
            const targetToken = patient.fcmToken || patient.expoPushToken;
            try {
                await this.firebaseService.sendPushNotification(
                    targetToken!,
                    `Pengingat Janji Temu ${dayText.charAt(0).toUpperCase() + dayText.slice(1)}`,
                    `Anda memiliki janji temu di ${clinic.name} ${dayText} pukul ${timeFormat.format(new Date(app.appointmentTime))} WIB.`
                );
                // Tandai reminder terkirim jika perlu
            } catch (error) {
                this.logger.error(`Gagal kirim pengingat janji temu ${dayText} ke ${patient.name}`, error);
            }
        }
     }
  }

  private async sendVaccinationReminders(date: Date, dayText: string) {
     const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
     const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

     const vaccinations = await this.scheduledVaccinationModel.find({
        scheduledDate: { $gte: startOfDay, $lte: endOfDay },
        status: 'SCHEDULED',
        // Tambahkan filter 'isReminderSent' jika ada
     }).populate<{ patient: UserDocument }>('patient').populate<{ clinic: ClinicDocument}>('clinic');

     const timeFormat = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

     for (const vax of vaccinations) {
        const patient = vax.patient;
        const clinic = vax.clinic;
         if (patient && (patient.fcmToken || patient.expoPushToken) && clinic) {
            const targetToken = patient.fcmToken || patient.expoPushToken;
             try {
                await this.firebaseService.sendPushNotification(
                    targetToken!,
                    `Pengingat Vaksinasi ${dayText.charAt(0).toUpperCase() + dayText.slice(1)}`,
                    `Anda memiliki jadwal vaksin ${vax.vaccineName} di ${clinic.name} ${dayText} pukul ${timeFormat.format(new Date(vax.scheduledDate))} WIB.`
                );
                // Tandai reminder terkirim jika perlu
            } catch (error) {
                this.logger.error(`Gagal kirim pengingat vaksin ${dayText} ke ${patient.name}`, error);
            }
        }
     }
  }
}