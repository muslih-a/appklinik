import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { Clinic, ClinicDocument } from './schemas/clinic.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { AppointmentsService } from 'src/appointments/appointments.service';

interface AuthenticatedUser {
  id: string;
  role: string;
  clinicId: string;
}

@Injectable()
export class ClinicsService {
  constructor(
    @InjectModel(Clinic.name) private clinicModel: Model<ClinicDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleResetNowServing() {
    console.log('RESETTING: Mengatur ulang semua nomor "nowServing" menjadi 0.');
    try {
      await this.clinicModel.updateMany({}, { $set: { nowServing: 0 } });
      console.log('SUCCESS: Semua nomor "nowServing" berhasil direset.');
    } catch (error) {
      console.error('ERROR: Gagal mereset nomor "nowServing".', error);
    }
  }

  async getPublicQueueData(displayKey: string) {
    const clinic: ClinicDocument | null = await this.clinicModel.findOne({ displayKey }).exec();
    if (!clinic) {
      throw new NotFoundException('Data antrean untuk klinik ini tidak ditemukan.');
    }
    const activeQueue = await this.appointmentsService.getActiveQueue((clinic._id as any).toString());
    const nextInQueue = activeQueue.slice(0, 3).map(patient => patient.queueNumber);
    return {
      nowServing: clinic.nowServing,
      nextInQueue: nextInQueue,
    };
  }

  async findAllForAppointment(user: AuthenticatedUser): Promise<Clinic[]> {
    return this.clinicModel
      .find({ _id: user.clinicId })
      .populate({
        path: 'doctor',
        select: 'name',
      })
      .select('name')
      .exec();
  }

  async create(createClinicDto: CreateClinicDto): Promise<Clinic> {
    const newClinic = new this.clinicModel(createClinicDto);
    return newClinic.save();
  }

  async updateNowServing(user: AuthenticatedUser, queueNumber: number): Promise<Clinic> {
    const clinicId = await this.getClinicIdForDoctor(user);
    const updatedClinic = await this.clinicModel.findByIdAndUpdate(
      clinicId,
      { $set: { nowServing: queueNumber } },
      { new: true }
    );
    if (!updatedClinic) throw new NotFoundException('Klinik tidak ditemukan.');
    return updatedClinic;
  }

  async findAll(): Promise<Clinic[]> {
    return this.clinicModel.find().exec();
  }

  async findOne(id: string): Promise<Clinic> {
    const clinic = await this.clinicModel.findById(id).exec();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID "${id}" not found.`);
    }
    return clinic;
  }

  async update(id: string, updateClinicDto: CreateClinicDto): Promise<Clinic> {
    const updatedClinic = await this.clinicModel
      .findByIdAndUpdate(id, updateClinicDto, { new: true })
      .exec();
    if (!updatedClinic) {
      throw new NotFoundException(`Clinic with ID "${id}" not found.`);
    }
    return updatedClinic;
  }

  async remove(id: string): Promise<Clinic> {
    const deletedClinic = await this.clinicModel.findByIdAndDelete(id).exec();
    if (!deletedClinic) {
      throw new NotFoundException(`Clinic with ID "${id}" not found.`);
    }
    return deletedClinic;
  }

  async findPatientsByClinic(clinicId: string): Promise<User[]> {
    return this.userModel
      .find({ clinic: clinicId, role: 'Patient' })
      .select('-password')
      .exec();
  }

  private async getClinicIdForDoctor(user: AuthenticatedUser): Promise<string> {
    const clinicId = user.clinicId;
    if (!clinicId) {
      throw new ForbiddenException('Dokter tidak terhubung dengan klinik manapun.');
    }
    return clinicId;
  }

  async closeRegistrationNow(user: AuthenticatedUser): Promise<Clinic> {
    const clinicId = await this.getClinicIdForDoctor(user);
    const updatedClinic = await this.clinicModel.findByIdAndUpdate(
      clinicId,
      { $set: { isRegistrationClosed: true } },
      { new: true }
    );
    if (!updatedClinic) throw new NotFoundException('Klinik tidak ditemukan.');
    return updatedClinic;
  }

  async openRegistration(user: AuthenticatedUser): Promise<Clinic> {
    const clinicId = await this.getClinicIdForDoctor(user);
    const updatedClinic = await this.clinicModel.findByIdAndUpdate(
      clinicId,
      {
        $set: { isRegistrationClosed: false },
        $unset: { registrationCloseTime: "" }
      },
      { new: true }
    );
    if (!updatedClinic) throw new NotFoundException('Klinik tidak ditemukan.');
    return updatedClinic;
  }

  async scheduleClosing(user: AuthenticatedUser, closeTime: Date): Promise<Clinic> {
    const clinicId = await this.getClinicIdForDoctor(user);
    const updatedClinic = await this.clinicModel.findByIdAndUpdate(
      clinicId,
      {
        $set: {
          registrationCloseTime: closeTime,
          isRegistrationClosed: false
        }
      },
      { new: true }
    );
    if (!updatedClinic) throw new NotFoundException('Klinik tidak ditemukan.');
    return updatedClinic;
  }

  async updateByDoctor(id: string, updateClinicDto: CreateClinicDto, user: AuthenticatedUser): Promise<Clinic> {
    if (user.clinicId?.toString() !== id) {
      throw new ForbiddenException('Anda tidak berhak memperbarui klinik ini.');
    }
    const updatedClinic = await this.clinicModel
      .findByIdAndUpdate(id, updateClinicDto, { new: true })
      .exec();
    if (!updatedClinic) {
      throw new NotFoundException(`Clinic with ID "${id}" not found.`);
    }
    return updatedClinic;
  }

  async assignDoctorToClinic(clinicId: string, doctorId: string): Promise<Clinic> {
    const clinic = await this.clinicModel.findById(clinicId).exec();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID "${clinicId}" not found.`);
    }

    const doctor = await this.userModel.findById(doctorId).exec();
    if (!doctor) {
      throw new NotFoundException(`User (Doctor) with ID "${doctorId}" not found.`);
    }

    if (doctor.role !== 'Doctor') {
      throw new BadRequestException(`User with ID "${doctorId}" is not a Doctor.`);
    }

    // --- [PERUBAHAN LOGIKA DI SINI] ---
    // Tugaskan seluruh objek untuk lolos dari pemeriksaan tipe data TypeScript.
    clinic.doctor = doctor;
    doctor.clinic = clinic;
    // ------------------------------------

    await doctor.save();
    await clinic.save();
    
    return clinic;
  }
}