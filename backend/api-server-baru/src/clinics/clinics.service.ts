import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { Clinic, ClinicDocument } from './schemas/clinic.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
// AppointmentModel tidak di-inject di sini lagi, kita pakai akses DB langsung
// import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';

interface AuthenticatedUser {
  id: string;
  role: string;
  clinicId: string;
}

@Injectable()
export class ClinicsService {
  private readonly logger = new Logger(ClinicsService.name);

  constructor(
    @InjectModel(Clinic.name) private clinicModel: Model<ClinicDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    // AppointmentService tidak diperlukan lagi di sini
  ) {}

  // Cron job diubah untuk mereset nowServingDoctor di User (Dokter)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleResetNowServingDoctor() {
    this.logger.log('CRON: Mereset nowServingDoctor untuk semua Dokter...');
    try {
      const result = await this.userModel.updateMany(
        { role: 'Doctor' }, // Targetkan hanya dokter
        { $set: { nowServingDoctor: 0 } } // Reset field baru
      );
      this.logger.log(`CRON: Reset nowServingDoctor selesai. ${result.modifiedCount} dokter diupdate.`);
    } catch (error) {
      this.logger.error('CRON: Gagal mereset nowServingDoctor.', error);
    }
  }

  // API data publik diubah untuk menampilkan nowServing per dokter
  async getPublicQueueData(displayKey: string) {
    const clinic = await this.clinicModel.findOne({ displayKey }).exec();
    if (!clinic) {
      throw new NotFoundException('Data antrean untuk klinik ini tidak ditemukan.');
    }

    // Cari dokter yang aktif di klinik ini
    const activeDoctors = await this.userModel.find({
        clinic: clinic._id,
        role: 'Doctor'
    })
    .select('name nowServingDoctor')
    .exec();

    // Ambil antrian pasien yang menunggu (status WAITING) untuk klinik ini
    const waitingAppointments = await (await this.getWaitingAppointmentsForClinic(clinic.id.toString()))
                                      .slice(0, 5); // Ambil misal 5 berikutnya

    // Format data dokter untuk response
    const doctorsServingInfo = activeDoctors.map(doc => ({
        doctorId: doc._id,
        doctorName: doc.name,
        nowServing: doc.nowServingDoctor ?? 0 // Gunakan field baru
    }));

    // --- [PERBAIKAN DI SINI] ---
    // Hapus baris 'nowServing: clinic.nowServing'
    return {
      clinicName: clinic.name,
      doctors: doctorsServingInfo, // Kirim array dokter dan nowServing masing-masing
      // -----------------------------
      nextInQueue: waitingAppointments.map(app => ({
          queueNumber: app.queueNumber,
          // doctorId: app.doctor, // Bisa tambahkan ID dokter jika perlu
      })),
    };
  }


  // Fungsi bantu (bisa dipindah ke AppointmentsService jika lebih cocok)
  // Menggunakan akses collection DB langsung karena AppointmentModel tidak di-inject di sini
  private async getWaitingAppointmentsForClinic(clinicId: string): Promise<{_id: Types.ObjectId, queueNumber: number, doctor: Types.ObjectId}[]> {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
      const appointments = await this.userModel.db.collection('appointments').find({
          clinic: new Types.ObjectId(clinicId),
          status: 'WAITING',
          appointmentTime: { $gte: startOfDay, $lte: endOfDay }
      })
      .sort({ queueNumber: 1 })
      .project({ queueNumber: 1, doctor: 1})
      .toArray();

      // Perlu cast tipe karena akses collection langsung
      return appointments as Array<{_id: Types.ObjectId, queueNumber: number, doctor: Types.ObjectId}>;
  }


  async findAllForAppointment(user: AuthenticatedUser): Promise<Clinic[]> {
    // Fungsi ini tidak perlu diubah
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
    // Fungsi ini tidak perlu diubah
    const newClinic = new this.clinicModel(createClinicDto);
    return newClinic.save();
  }

  // --- Hapus method updateNowServing ---
  // async updateNowServing(...) { ... }
  // ------------------------------------

  async findAll(): Promise<Clinic[]> {
    // Fungsi ini tidak perlu diubah
    return this.clinicModel.find().exec();
  }

  async findOne(id: string): Promise<Clinic> {
     // Fungsi ini tidak perlu diubah
    if (!Types.ObjectId.isValid(id)) {
       throw new BadRequestException('Format ID Klinik tidak valid.');
    }
    const clinic = await this.clinicModel.findById(id).exec();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID "${id}" not found.`);
    }
    return clinic;
  }

  async update(id: string, updateClinicDto: CreateClinicDto): Promise<Clinic> {
    // Fungsi ini tidak perlu diubah
    if (!Types.ObjectId.isValid(id)) {
       throw new BadRequestException('Format ID Klinik tidak valid.');
    }
    const updatedClinic = await this.clinicModel
      .findByIdAndUpdate(id, updateClinicDto, { new: true })
      .exec();
    if (!updatedClinic) {
      throw new NotFoundException(`Clinic with ID "${id}" not found.`);
    }
    return updatedClinic;
  }

  async remove(id: string): Promise<Clinic> {
     // Fungsi ini tidak perlu diubah
     if (!Types.ObjectId.isValid(id)) {
       throw new BadRequestException('Format ID Klinik tidak valid.');
    }
    const deletedClinic = await this.clinicModel.findByIdAndDelete(id).exec();
    if (!deletedClinic) {
      throw new NotFoundException(`Clinic with ID "${id}" not found.`);
    }
    return deletedClinic;
  }

  async findPatientsByClinic(clinicId: string): Promise<User[]> {
    // Fungsi ini tidak perlu diubah
    if (!Types.ObjectId.isValid(clinicId)) {
       throw new BadRequestException('Format ID Klinik tidak valid.');
    }
    return this.userModel
      .find({ clinic: clinicId, role: 'Patient' })
      .select('-password')
      .exec();
  }

  // Rename fungsi helper
  private async getClinicIdForDoctorOrAdmin(user: AuthenticatedUser): Promise<string> {
    const clinicId = user.clinicId;
    if (!clinicId) {
      throw new ForbiddenException('User tidak terhubung dengan klinik manapun.');
    }
    return clinicId;
  }

  async closeRegistrationNow(user: AuthenticatedUser): Promise<Clinic> {
    const clinicId = await this.getClinicIdForDoctorOrAdmin(user);
    const updatedClinic = await this.clinicModel.findByIdAndUpdate(
      clinicId,
      { $set: { isRegistrationClosed: true } },
      { new: true }
    );
    if (!updatedClinic) throw new NotFoundException('Klinik tidak ditemukan.');
    return updatedClinic;
  }

  async openRegistration(user: AuthenticatedUser): Promise<Clinic> {
    const clinicId = await this.getClinicIdForDoctorOrAdmin(user);
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
    const clinicId = await this.getClinicIdForDoctorOrAdmin(user);
    if (!(closeTime instanceof Date) || isNaN(closeTime.getTime())) {
        throw new BadRequestException('Format waktu penutupan tidak valid.');
    }
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
     if (!Types.ObjectId.isValid(id)) {
       throw new BadRequestException('Format ID Klinik tidak valid.');
    }
    const updatedClinic = await this.clinicModel
      .findByIdAndUpdate(id, updateClinicDto, { new: true })
      .exec();
    if (!updatedClinic) {
      throw new NotFoundException(`Clinic with ID "${id}" not found.`);
    }
    return updatedClinic;
  }

  async assignDoctorToClinic(clinicId: string, doctorId: string): Promise<ClinicDocument | null> { // Ubah return type
    if (!Types.ObjectId.isValid(clinicId) || !Types.ObjectId.isValid(doctorId)) {
       throw new BadRequestException('Format ID Klinik atau Dokter tidak valid.');
    }
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

    clinic.doctor = doctor.id; // Simpan ObjectId
    doctor.clinic = clinic.id; // Simpan ObjectId

    await doctor.save();
    // await clinic.save(); // Save clinic mungkin tidak perlu jika hanya update ref doctor

    // Kembalikan clinic dengan populate
    return this.clinicModel.findById(clinicId).populate('doctor').exec();
  }
}