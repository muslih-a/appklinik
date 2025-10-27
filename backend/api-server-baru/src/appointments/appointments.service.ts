import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
// MongooseModule tidak perlu diimpor di sini, hanya di file .module.ts
// import { MongooseModule } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose'; // <-- Tambahkan Types jika belum
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { Clinic, ClinicDocument } from '../clinics/schemas/clinic.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { RecordEmrDto } from './dto/record-emr.dto';
import {
  ScheduledVaccination,
  ScheduledVaccinationDocument,
} from '../scheduled-vaccinations/schemas/scheduled-vaccination.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationService } from '../notifications/notifications.service';
// Pastikan UserDocument diimpor
import { User, UserDocument } from '../auth/schemas/user.schema';

interface AuthenticatedUser {
  id: string;
  role: string;
}

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Clinic.name)
    private clinicModel: Model<ClinicDocument>,
    @InjectModel(ScheduledVaccination.name)
    private scheduledVaccinationModel: Model<ScheduledVaccinationDocument>,
    @InjectModel(User.name) // Injeksi UserModel sudah ada
    private userModel: Model<UserDocument>,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationService: NotificationService,
  ) {}

  // Method bantu untuk memicu event update antrean
  private async triggerQueueUpdate(clinicId: string) {
    // Fungsi ini tidak perlu diubah
    const activeQueue = await this.findActiveQueueForClinic(clinicId);
    const onHoldQueue = await this.findOnHoldQueueForClinic(clinicId);
    const dailyHistory = await this.findDailyHistoryForClinic(clinicId);

    this.eventEmitter.emit('queue.updated', {
      clinicId,
      payload: { activeQueue, onHoldQueue, dailyHistory },
    });
  }

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    // Fungsi ini tidak perlu diubah
    const { patientId, doctorId, clinicId, appointmentTime } = createAppointmentDto;

    const clinic = await this.clinicModel.findById(clinicId);
    if (!clinic) {
      throw new NotFoundException('Klinik tidak ditemukan.');
    }

    const appointmentDate = new Date(appointmentTime);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    if (appointmentDate >= startOfToday && appointmentDate <= endOfToday) {
      if (clinic.isRegistrationClosed) {
        throw new ConflictException(
          'Mohon maaf, pendaftaran untuk hari ini sudah ditutup oleh klinik.',
        );
      }
      if (clinic.registrationCloseTime && new Date() > clinic.registrationCloseTime) {
        throw new ConflictException(
          `Mohon maaf, pendaftaran telah ditutup secara otomatis.`,
        );
      }
    }

    const startOfDayForNewAppt = new Date(appointmentDate);
    startOfDayForNewAppt.setHours(0, 0, 0, 0);
    const endOfDayForNewAppt = new Date(appointmentDate);
    endOfDayForNewAppt.setHours(23, 59, 59, 999);

    const existingAppointmentOnThatDay = await this.appointmentModel.findOne({
      patient: patientId,
      status: { $in: ['SCHEDULED', 'WAITING', 'IN_PROGRESS', 'ON_HOLD'] },
      appointmentTime: {
        $gte: startOfDayForNewAppt,
        $lte: endOfDayForNewAppt,
      },
    });

    if (existingAppointmentOnThatDay) {
      throw new ConflictException(
        'Pasien sudah memiliki janji temu aktif pada tanggal tersebut.',
      );
    }

    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);
    const appointmentsCount = await this.appointmentModel.countDocuments({
      doctor: doctorId,
      appointmentTime: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });
    const queueNumber = appointmentsCount + 1;
    const newAppointment = new this.appointmentModel({
      patient: patientId,
      doctor: doctorId,
      clinic: clinicId,
      appointmentTime,
      queueNumber,
    });

    const savedAppointment = await newAppointment.save();
    await this.triggerQueueUpdate(clinicId);
    return savedAppointment;
  }

  async updateStatus(
    id: string,
    updateAppointmentStatusDto: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    const { status } = updateAppointmentStatusDto;

    // Populate doctor sudah ada
    const appointmentToUpdate = await this.appointmentModel.findById(id)
      .populate<{ patient: UserDocument }>('patient')
      .populate<{ clinic: ClinicDocument }>('clinic')
      .populate<{ doctor: UserDocument }>('doctor');

    if (!appointmentToUpdate) {
      throw new NotFoundException(`Janji temu dengan ID "${id}" tidak ditemukan`);
    }

    // Pastikan clinic tidak null sebelum akses properti
    const clinicId = appointmentToUpdate.clinic?.id?.toString();
    const clinicName = appointmentToUpdate.clinic?.name;
    const doctor = appointmentToUpdate.doctor;
    const queueNumber = appointmentToUpdate.queueNumber;

    // Jika clinicId tidak ada, mungkin ada masalah data
    if (!clinicId || !clinicName) {
        this.logger.error(`Data clinic tidak lengkap untuk appointment ${id}`);
        throw new NotFoundException(`Data klinik terkait janji temu ${id} tidak ditemukan.`);
    }


    const previousStatus = appointmentToUpdate.status;
    let updatePayload: any = {};
    const now = new Date();

    // Logika penentuan payload (tidak berubah)
    if (status === 'SKIPPED' && previousStatus !== 'ON_HOLD') {
      updatePayload = { status: 'ON_HOLD', onHoldTime: now };
    } else {
      updatePayload.status = status;
      if (status === 'IN_PROGRESS' && !appointmentToUpdate.consultationStartTime) {
        updatePayload.consultationStartTime = now;
      }
      if (status === 'COMPLETED' && !appointmentToUpdate.consultationEndTime) {
        updatePayload.consultationEndTime = now;
      }
      if (status === 'WAITING' && previousStatus === 'ON_HOLD') {
        updatePayload.$unset = { onHoldTime: 1 };
      }
    }

    // Update nowServingDoctor saat IN_PROGRESS (logika sudah ada dan benar)
    if (status === 'IN_PROGRESS' && doctor && doctor.role === 'Doctor') {
        try {
            await this.userModel.updateOne(
                { _id: doctor._id },
                { $set: { nowServingDoctor: queueNumber } }
            ).exec();
            this.logger.log(`nowServingDoctor untuk dokter ${doctor._id} diupdate ke ${queueNumber}`);
        } catch (err) {
            this.logger.error(`Gagal mengupdate nowServingDoctor untuk dokter ${doctor._id}`, err);
        }
    }

    // Update appointment
    const updatedAppointment = await this.appointmentModel.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true },
    )
      .populate<{ patient: UserDocument }>('patient')
      .populate<{ clinic: ClinicDocument }>('clinic')
      .populate<{ doctor: UserDocument }>('doctor');

    if (!updatedAppointment) {
      throw new NotFoundException(
        `Janji temu dengan ID "${id}" tidak ditemukan setelah proses update`,
      );
    }

    // Trigger WebSocket (tidak berubah)
    await this.triggerQueueUpdate(clinicId);

    // Kirim Notifikasi Push (tidak berubah)
    const shouldNotify = (status === 'WAITING' && previousStatus !== 'WAITING') ||
                         (status === 'IN_PROGRESS' && previousStatus !== 'IN_PROGRESS');

    if (shouldNotify) {
      const patient = updatedAppointment.patient;
      // Gunakan clinicName yang sudah divalidasi
      if (patient && patient.expoPushToken && clinicName) {
        this.logger.log(`Mencoba mengirim notifikasi panggilan ke pasien ID: ${patient._id}`);
        this.notificationService.sendPatientCallNotification(
          patient.expoPushToken,
          clinicName,
          updatedAppointment.queueNumber,
        ).catch(err => {
          this.logger.error(`Error background saat mengirim notifikasi untuk appointment ${id}: ${err.message}`);
        });
      } else if (!patient?.expoPushToken) {
        this.logger.warn(
          `Expo Push Token tidak ditemukan untuk pasien ID: ${patient?._id} pada appointment ${id}. Tidak dapat mengirim notifikasi panggilan.`,
        );
      }
    }

    return updatedAppointment;
  }


  async cancelByUser(appointmentId: string, patientId: string): Promise<Appointment> {
    // Fungsi ini tidak perlu diubah
    const appointment = await this.appointmentModel.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID "${appointmentId}" not found`);
    }
    // Pastikan patient ID valid sebelum toString()
    if (!appointment.patient || appointment.patient.toString() !== patientId) {
      throw new ForbiddenException('Anda tidak berhak membatalkan janji temu ini.');
    }

    appointment.status = 'CANCELLED';
    await appointment.save();

    // Pastikan clinic ID valid sebelum toString()
    if (appointment.clinic) {
        await this.triggerQueueUpdate(appointment.clinic.toString());
    } else {
        this.logger.warn(`Clinic ID tidak ditemukan pada appointment ${appointmentId} saat cancel.`);
    }


    return appointment;
  }

  async findActiveQueueForClinic(clinicId: string): Promise<Appointment[]> {
    // Fungsi ini tidak perlu diubah, tapi populate dokter mungkin berguna
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return this.appointmentModel.find({
      clinic: clinicId,
      appointmentTime: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $in: ['SCHEDULED', 'WAITING', 'IN_PROGRESS'] }
    })
      .populate('patient', 'name') // Pilih field patient yg relevan
      .populate('doctor', 'name') // Populate dokter juga
      .sort({ queueNumber: 'asc' })
      .exec();
  }
  async findOnHoldQueueForClinic(clinicId: string): Promise<Appointment[]> {
    // Fungsi ini tidak perlu diubah
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return this.appointmentModel.find({
      clinic: clinicId,
      appointmentTime: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: 'ON_HOLD'
    })
      .populate('patient', 'name')
      .populate('doctor', 'name')
      .sort({ onHoldTime: 'asc' })
      .exec();
  }
  async findDailyHistoryForClinic(clinicId: string): Promise<Appointment[]> {
    // Fungsi ini tidak perlu diubah
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return this.appointmentModel.find({
      clinic: clinicId,
      appointmentTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['SCHEDULED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'ON_HOLD'] },
    })
      .populate('patient', 'name')
      .populate('doctor', 'name')
      .sort({ queueNumber: 'asc' })
      .exec();
  }

  // --- [PERUBAHAN FASE 3 - LANGKAH 6 SUDAH DITERAPKAN] ---
  async findMyAppointmentForToday(patientId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const myAppointment = await this.appointmentModel
      .findOne({
        patient: patientId,
        appointmentTime: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['SCHEDULED', 'WAITING', 'IN_PROGRESS', 'ON_HOLD'] },
      })
      .populate<{ clinic: ClinicDocument }>({
         path: 'clinic',
         select: 'averageConsultationTime openingTime name',
      })
      .populate<{ doctor: UserDocument }>({
         path: 'doctor',
         select: 'nowServingDoctor',
      })
      .exec();

    if (!myAppointment) {
      return null;
    }

    const clinicData = myAppointment.clinic as ClinicDocument | null;
    const doctorData = myAppointment.doctor as UserDocument | null;
    const nowServingNumber = doctorData?.nowServingDoctor ?? 0;
    let estimatedStartTime: Date | null = null;

    if (clinicData && doctorData && clinicData.averageConsultationTime && myAppointment.queueNumber > nowServingNumber) {
      const patientsAhead = myAppointment.queueNumber - nowServingNumber - 1;
      const averageTime = clinicData.averageConsultationTime;
      const waitTimeInMinutes = patientsAhead >= 0 ? patientsAhead * averageTime : 0;
      const now = new Date();
      const [hours, minutes] = (clinicData.openingTime ?? '08:00').split(':').map(Number);
      const openingTimeToday = new Date();
      openingTimeToday.setHours(hours, minutes, 0, 0);
      const calculationBaseTime = now > openingTimeToday ? now : openingTimeToday;
      estimatedStartTime = new Date(calculationBaseTime.getTime() + waitTimeInMinutes * 60000);
    }

    const appointmentObject = myAppointment.toObject();
    return {
      ...appointmentObject,
      clinic: clinicData ? { _id: clinicData._id, name: clinicData.name, averageConsultationTime: clinicData.averageConsultationTime, openingTime: clinicData.openingTime } : null,
      doctor: doctorData ? { _id: doctorData._id, nowServingDoctor: doctorData.nowServingDoctor } : null,
      estimatedStartTime: estimatedStartTime,
      nowServing: nowServingNumber,
    };
  }
  // --- [AKHIR PERUBAHAN FASE 3 - LANGKAH 6] ---


  async findHistoryForDoctor(
    user: AuthenticatedUser,
    status?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    // Fungsi ini tidak perlu diubah
    const query: any = { doctor: user.id };
    if (status) {
      query.status = status;
    }
    if (startDate && endDate) {
        // Pastikan konversi ke Date jika inputnya string
        const start = startDate instanceof Date ? startDate : new Date(startDate || 0);
        const end = endDate instanceof Date ? endDate : new Date(endDate || Date.now());
        query.appointmentTime = { $gte: start, $lte: end };
    }
    const results = await this.appointmentModel
      .find(query)
      .populate('patient', 'name')
      .sort({ appointmentTime: -1 })
      .exec();
    return {
      count: results.length,
      data: results,
    };
  }
  async findScheduleForDoctor(
    user: AuthenticatedUser,
    startDate: Date,
    endDate: Date,
  ) {
    // Fungsi ini tidak perlu diubah, tapi pastikan date valid
    const start = startDate instanceof Date ? startDate : new Date(startDate || 0);
    const end = endDate instanceof Date ? endDate : new Date(endDate || Date.now());

    const appointments = await this.appointmentModel
      .find({
        doctor: user.id,
        appointmentTime: { $gte: start, $lte: end },
        status: { $in: ['SCHEDULED', 'WAITING', 'IN_PROGRESS', 'ON_HOLD'] },
      })
      .populate<{patient: User}>('patient', 'name')
      .sort({ appointmentTime: 'asc' })
      .exec();
    const vaccinations = await this.scheduledVaccinationModel
      .find({
        doctor: user.id,
        scheduledDate: { $gte: start, $lte: end },
        status: 'SCHEDULED',
      })
      .populate<{patient: User}>('patient', 'name')
      .sort({ scheduledDate: 'asc' })
      .exec();

    const combinedSchedule = [
      ...appointments.map(appt => ({
        id: appt._id,
        title: `Konsultasi: ${appt.patient?.name || 'Pasien ???'}`,
        start: appt.appointmentTime,
        // Estimasi end time, bisa disesuaikan
        end: new Date(new Date(appt.appointmentTime).getTime() + (appt.clinic?.averageConsultationTime || 15) * 60000),
        type: 'appointment'
      })),
      ...vaccinations.map(vax => ({
        id: vax._id,
        title: `Vaksin (${vax.vaccineName}): ${vax.patient?.name || 'Pasien ???'}`,
        start: vax.scheduledDate,
        end: new Date(new Date(vax.scheduledDate).getTime() + 15 * 60000), // Estimasi 15 menit?
        type: 'vaccination'
      }))
    ];

    combinedSchedule.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return combinedSchedule;
  }
  async recordEmr(
    id: string,
    recordEmrDto: RecordEmrDto,
  ): Promise<Appointment> {
    // Fungsi ini tidak perlu diubah
    const appointment = await this.appointmentModel.findByIdAndUpdate(
      id,
      { $set: recordEmrDto },
      { new: true },
    );
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID "${id}" not found`);
    }
    return appointment;
  }
  async findForPatient(patientId: string): Promise<Appointment[]> {
    // Fungsi ini tidak perlu diubah
    return this.appointmentModel
      .find({ patient: patientId })
      .populate('doctor', 'name')
      .populate('clinic', 'name')
      .sort({ appointmentTime: 'desc' })
      .exec();
  }
  async getActiveQueue(clinicId: string): Promise<AppointmentDocument[]> {
     // Fungsi ini tidak perlu diubah, tapi mungkin bisa lebih spesifik
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const queue = await this.appointmentModel
      .find({
        clinic: clinicId,
        status: 'WAITING', // Hanya yang sudah dipanggil
        appointmentTime: { // Filter janji temu hari ini
          $gte: today,
          $lt: tomorrow,
        },
      })
      .sort({ queueNumber: 'asc' })
      .exec();
    return queue;
  }
}