import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { RecordEmrDto } from './dto/record-emr.dto';
import { EventsGateway } from '../events/events.gateway';
import {
  ScheduledVaccination,
  ScheduledVaccinationDocument,
} from '../scheduled-vaccinations/schemas/scheduled-vaccination.schema';

interface AuthenticatedUser {
  id: string;
  role: string;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    private readonly eventsGateway: EventsGateway,
    @InjectModel(ScheduledVaccination.name)
    private scheduledVaccinationModel: Model<ScheduledVaccinationDocument>,
  ) {}

  // ... (fungsi create, findActiveQueueForClinic, findDailyHistoryForClinic tidak berubah) ...

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const { patientId, doctorId, clinicId, appointmentTime } = createAppointmentDto;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingActiveAppointment = await this.appointmentModel.findOne({
      patient: patientId,
      status: { $in: ['SCHEDULED', 'WAITING', 'IN_PROGRESS'] },
      appointmentTime: { $gte: today },
    });
    if (existingActiveAppointment) {
      throw new ConflictException(
        'Anda sudah memiliki janji temu yang aktif dan belum selesai.',
      );
    }
    const appointmentDate = new Date(appointmentTime);
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
    return newAppointment.save();
  }
  
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
  
  async findDailyHistoryForClinic(clinicId: string): Promise<Appointment[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return this.appointmentModel.find({
      clinic: clinicId,
      appointmentTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['SCHEDULED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED'] },
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
      status: { $in: ['SCHEDULED', 'WAITING', 'IN_PROGRESS'] },
    })
    .populate({
      path: 'clinic',
      select: 'averageConsultationTime',
    })
    .exec();

  if (!myAppointment) {
    return null;
  }

  const nowServing = await this.appointmentModel
    .findOne({
      doctor: myAppointment.doctor,
      appointmentTime: { $gte: startOfDay, $lte: endOfDay },
      status: 'IN_PROGRESS',
    })
    .sort({ queueNumber: 'asc' })
    .exec();
  
  let estimatedStartTime: Date | null = null;
  const nowServingNumber = nowServing ? nowServing.queueNumber : 0;
  
  const clinicData = myAppointment.clinic as any;

  if (clinicData && clinicData.averageConsultationTime && myAppointment.queueNumber > nowServingNumber) {
    const patientsAhead = myAppointment.queueNumber - nowServingNumber - 1;
    const averageTime = clinicData.averageConsultationTime;
    const waitTimeInMinutes = patientsAhead >= 0 ? patientsAhead * averageTime : 0;
    
    const now = new Date();
    estimatedStartTime = new Date(now.getTime() + waitTimeInMinutes * 60000);
  }
  
  // --- PERBAIKAN DI SINI ---
  // Buat objek baru dengan menyalin semua data janji temu
  // lalu tambahkan properti baru estimatedStartTime
  return {
    ...myAppointment.toObject(),
    estimatedStartTime: estimatedStartTime,
  };
}

  // ... (fungsi-fungsi lain tidak berubah) ...
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
        status: { $in: ['SCHEDULED', 'WAITING', 'IN_PROGRESS'] },
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

  async updateStatus(
    id: string,
    updateAppointmentStatusDto: UpdateAppointmentStatusDto,
  ): Promise<Appointment> {
    const { status } = updateAppointmentStatusDto;

    if (status === 'SKIPPED') {
      const skippedAppointment = await this.appointmentModel.findById(id);
      if (!skippedAppointment) {
        throw new NotFoundException(`Appointment with ID "${id}" not found`);
      }
      skippedAppointment.status = 'SKIPPED';
      await skippedAppointment.save();
      const { patient, doctor, clinic, appointmentTime } = skippedAppointment;
      const appointmentDate = new Date(appointmentTime);
      const startOfDay = new Date(appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);
      const lastQueue = await this.appointmentModel.findOne({
        doctor: doctor,
        appointmentTime: { $gte: startOfDay, $lte: endOfDay },
      }).sort({ queueNumber: -1 });
      const newQueueNumber = lastQueue ? lastQueue.queueNumber + 1 : 1;
      const newAppointment = new this.appointmentModel({
        patient,
        doctor,
        clinic,
        appointmentTime,
        queueNumber: newQueueNumber,
        status: 'SCHEDULED',
      });
      await newAppointment.save();
      const clinicId = clinic.toString();
      const activeQueue = await this.findActiveQueueForClinic(clinicId);
      const dailyHistory = await this.findDailyHistoryForClinic(clinicId);
      this.eventsGateway.sendQueueUpdate(clinicId, { activeQueue, dailyHistory });
      return skippedAppointment;
    } else {
      const updatePayload: any = { status: status };
      if (status === 'IN_PROGRESS') {
        updatePayload.consultationStartTime = new Date();
      }
      if (status === 'COMPLETED') {
        updatePayload.consultationEndTime = new Date();
      }
      const updatedAppointment = await this.appointmentModel.findByIdAndUpdate(
        id,
        { $set: updatePayload },
        { new: true },
      ).populate('clinic');

      if (!updatedAppointment) {
        throw new NotFoundException(`Appointment with ID "${id}" not found`);
      }
      const clinicId = (updatedAppointment.clinic as any)._id.toString();
      if (updatedAppointment.status === 'WAITING') {
        const patientId = updatedAppointment.patient.toString();
        this.eventsGateway.sendPatientCalledNotification(
          clinicId,
          patientId,
          updatedAppointment.queueNumber,
        );
      }
      const activeQueue = await this.findActiveQueueForClinic(clinicId);
      const dailyHistory = await this.findDailyHistoryForClinic(clinicId);
      this.eventsGateway.sendQueueUpdate(clinicId, { activeQueue, dailyHistory });
      return updatedAppointment;
    }
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

    const clinicId = appointment.clinic.toString();
    const activeQueue = await this.findActiveQueueForClinic(clinicId);
    const dailyHistory = await this.findDailyHistoryForClinic(clinicId);
    this.eventsGateway.sendQueueUpdate(clinicId, { activeQueue, dailyHistory });

    return appointment;
  }

}