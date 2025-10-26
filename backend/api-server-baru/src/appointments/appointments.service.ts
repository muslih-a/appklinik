import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { Clinic, ClinicDocument } from '../clinics/schemas/clinic.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { RecordEmrDto } from './dto/record-emr.dto';
import {
  ScheduledVaccination,
  ScheduledVaccinationDocument,
} from '../scheduled-vaccinations/schemas/scheduled-vaccination.schema';
// 1. Impor EventEmitter2
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationService } from '../notifications/notifications.service'; // <-- 1. Import NotificationService
import { UserDocument } from 'src/auth/schemas/user.schema'; // <-- Pastikan UserDocument diimpor jika belum

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
    // 2. Ganti EventsGateway dengan EventEmitter2
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationService: NotificationService, // <-- 2. Inject NotificationService
  ) {}
  
  // Method bantu untuk memicu event update antrean
  private async triggerQueueUpdate(clinicId: string) {
    const activeQueue = await this.findActiveQueueForClinic(clinicId);
    const onHoldQueue = await this.findOnHoldQueueForClinic(clinicId);
    const dailyHistory = await this.findDailyHistoryForClinic(clinicId);
    
    // 3. Buat "pengumuman" ke sistem internal
    this.eventEmitter.emit('queue.updated', {
      clinicId,
      payload: { activeQueue, onHoldQueue, dailyHistory },
    });
  }

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
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
    
    // Kirim update setelah janji temu baru dibuat
    await this.triggerQueueUpdate(clinicId);

    return savedAppointment;
  }
  
  async updateStatus(
    id: string,
    updateAppointmentStatusDto: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    const { status } = updateAppointmentStatusDto;

    // Gunakan .populate untuk mendapatkan data pasien dan klinik sekaligus
    let appointmentToUpdate = await this.appointmentModel.findById(id)
      .populate<{ patient: UserDocument }>('patient') // Populate data pasien
      .populate<{ clinic: ClinicDocument }>('clinic'); // Populate data klinik

    if (!appointmentToUpdate) {
      throw new NotFoundException(`Janji temu dengan ID "${id}" tidak ditemukan`);
    }

    // Ambil clinicId dari data yang sudah di-populate
    const clinicId = appointmentToUpdate.clinic.id.toString();
    const clinicName = appointmentToUpdate.clinic.name; // Ambil nama klinik

    // --> [MODIFIKASI LOGIKA UPDATE STATUS] <--
    const previousStatus = appointmentToUpdate.status; // Simpan status sebelumnya
    let updatePayload: any = {};
    const now = new Date();

    if (status === 'SKIPPED' && previousStatus !== 'ON_HOLD') {
      appointmentToUpdate.status = 'ON_HOLD';
      appointmentToUpdate.onHoldTime = now;
      // Jangan langsung save, biarkan dihandle oleh findByIdAndUpdate di bawah
    } else {
        updatePayload.status = status; // Set status baru

        // Logika waktu berdasarkan status baru
        if (status === 'IN_PROGRESS' && !appointmentToUpdate.consultationStartTime) {
          updatePayload.consultationStartTime = now;
        }
        if (status === 'COMPLETED' && !appointmentToUpdate.consultationEndTime) {
            updatePayload.consultationEndTime = now;
        }
        // Jika status kembali ke WAITING dari ON_HOLD, hapus onHoldTime
        if (status === 'WAITING' && previousStatus === 'ON_HOLD') {
            updatePayload.$unset = { onHoldTime: 1 };
        }
    }
    // Gabungkan perubahan status (jika skipped) ke payload utama
    if (appointmentToUpdate.status === 'ON_HOLD' && status === 'SKIPPED') {
      updatePayload = {
        ...updatePayload, // Gabungkan payload lain jika ada
        status: 'ON_HOLD',
        onHoldTime: appointmentToUpdate.onHoldTime
      };
    } else if (status !== 'SKIPPED') {
      // Jika bukan skipped, pastikan status di payload benar
      updatePayload.status = status;
    }

    // Lakukan update di database
    const updatedAppointment = await this.appointmentModel.findByIdAndUpdate(
        id,
        updatePayload,
        { new: true }, // Mengembalikan dokumen yang sudah terupdate
    )
      .populate<{ patient: UserDocument }>('patient') // Populate lagi untuk mendapatkan data terbaru
      .populate<{ clinic: ClinicDocument }>('clinic');


    if (!updatedAppointment) {
      throw new NotFoundException(
        `Janji temu dengan ID "${id}" tidak ditemukan setelah proses update`,
      );
    }
    // ---------------------------------------------------

    // Panggil event update antrean (WebSocket)
    await this.triggerQueueUpdate(clinicId);

    // ---> [LOGIKA KIRIM NOTIFIKASI PUSH] <---
    // Kirim notifikasi jika status berubah menjadi 'WAITING' (dipanggil dari antrian)
    // atau 'IN_PROGRESS' (dipanggil langsung/mulai konsultasi)
    const shouldNotify = (status === 'WAITING' && previousStatus !== 'WAITING') ||
                         (status === 'IN_PROGRESS' && previousStatus !== 'IN_PROGRESS');

    if (shouldNotify) {
      const patient = updatedAppointment.patient; // Ambil data pasien dari hasil populate
      if (patient && patient.expoPushToken) {
        this.logger.log(`Mencoba mengirim notifikasi panggilan ke pasien ID: ${patient._id}`);
        // Kirim notifikasi tanpa menunggu (async) agar tidak memblok response API
        this.notificationService.sendPatientCallNotification(
            patient.expoPushToken,
            clinicName, // Gunakan nama klinik dari hasil populate
            updatedAppointment.queueNumber, // Sertakan nomor antrian
        ).catch(err => {
            // Log error jika pengiriman gagal, tapi jangan throw error ke client
            this.logger.error(`Error background saat mengirim notifikasi untuk appointment ${id}: ${err.message}`);
        });
      } else {
        this.logger.warn(
          `Expo Push Token tidak ditemukan untuk pasien ID: ${patient?._id} pada appointment ${id}. Tidak dapat mengirim notifikasi panggilan.`,
        );
      }
    }
    // ----------------------------------------------------

    return updatedAppointment; // Kembalikan appointment yang sudah terupdate
  }

  async cancelByUser(appointmentId: string, patientId: string): Promise<Appointment> {
    const appointment = await this.appointmentModel.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID "${appointmentId}" not found`);
    }
    if (appointment.patient.toString() !== patientId) {
      throw new ForbiddenException('Anda tidak berhak membatalkan janji temu ini.');
    }
    
    appointment.status = 'CANCELLED';
    await appointment.save();

    await this.triggerQueueUpdate(appointment.clinic.toString());

    return appointment;
  }
  
  // ... SISA FILE (findActiveQueueForClinic, findOnHoldQueueForClinic, dll.) TIDAK BERUBAH ...
  async findActiveQueueForClinic(clinicId: string): Promise<Appointment[]> {
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
      .populate('patient')
      .sort({ queueNumber: 'asc' })
      .exec();
  }
  async findOnHoldQueueForClinic(clinicId: string): Promise<Appointment[]> {
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
      .populate('patient')
      .sort({ onHoldTime: 'asc' })
      .exec();
  }
  async findDailyHistoryForClinic(clinicId: string): Promise<Appointment[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return this.appointmentModel.find({
      clinic: clinicId,
      appointmentTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['SCHEDULED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'ON_HOLD'] },
    })
      .populate('patient')
      .sort({ queueNumber: 'asc' })
      .exec();
  }
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
      .populate({
        path: 'clinic',
        select: 'averageConsultationTime openingTime nowServing',
      })
      .exec();
    if (!myAppointment) {
      return null;
    }
    const clinicData = myAppointment.clinic as ClinicDocument;
    const nowServingNumber = clinicData.nowServing || 0;
    let estimatedStartTime: Date | null = null;
    if (clinicData && clinicData.averageConsultationTime && myAppointment.queueNumber > nowServingNumber) {
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
    return {
      ...myAppointment.toObject(),
      estimatedStartTime: estimatedStartTime,
      nowServing: nowServingNumber,
    };
  }
  async findHistoryForDoctor(
    user: AuthenticatedUser,
    status?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const query: any = { doctor: user.id };
    if (status) {
      query.status = status;
    }
    if (startDate && endDate) {
      query.appointmentTime = { $gte: startDate, $lte: endDate };
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
    const appointments = await this.appointmentModel
      .find({
        doctor: user.id,
        appointmentTime: { $gte: startDate, $lte: endDate },
        status: { $in: ['SCHEDULED', 'WAITING', 'IN_PROGRESS', 'ON_HOLD'] },
      })
      .populate('patient', 'name')
      .sort({ appointmentTime: 'asc' })
      .exec();
    const vaccinations = await this.scheduledVaccinationModel
      .find({
        doctor: user.id,
        scheduledDate: { $gte: startDate, $lte: endDate },
        status: 'SCHEDULED',
      })
      .populate('patient', 'name')
      .sort({ scheduledDate: 'asc' })
      .exec();
    const combinedSchedule = [
      ...appointments.map(appt => ({
        id: appt._id,
        title: `Konsultasi: ${appt.patient.name}`,
        start: appt.appointmentTime,
        end: new Date(new Date(appt.appointmentTime).getTime() + 60 * 60 * 1000),
        type: 'appointment'
      })),
      ...vaccinations.map(vax => ({
        id: vax._id,
        title: `Vaksin (${vax.vaccineName}): ${vax.patient.name}`,
        start: vax.scheduledDate,
        end: new Date(new Date(vax.scheduledDate).getTime() + 30 * 60 * 1000),
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
    return this.appointmentModel
      .find({ patient: patientId })
      .populate('doctor', 'name')
      .populate('clinic', 'name')
      .sort({ appointmentTime: 'desc' })
      .exec();
  }
  async getActiveQueue(clinicId: string): Promise<AppointmentDocument[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const queue = await this.appointmentModel
      .find({
        clinic: clinicId,
        status: 'WAITING',
        createdAt: {
          $gte: today,
          $lt: tomorrow,
        },
      })
      .sort({ queueNumber: 'asc' })
      .exec();
    return queue;
  }
}