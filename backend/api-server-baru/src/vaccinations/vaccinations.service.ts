import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vaccination, VaccinationDocument } from './schemas/vaccination.schema';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';

@Injectable()
export class VaccinationsService {
  constructor(
    @InjectModel(Vaccination.name)
    private vaccinationModel: Model<VaccinationDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async create(createVaccinationDto: CreateVaccinationDto): Promise<Vaccination> {
    const { appointmentId, patientId, name, dateGiven, notes } = createVaccinationDto;

    // 1. Verifikasi janji temu (appointment)
    const appointment = await this.appointmentModel.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID "${appointmentId}" not found.`);
    }

    // 2. Ambil detail dokter dan klinik dari janji temu yang sudah ada
    const { doctor, clinic } = appointment;

    // 3. Buat catatan vaksinasi baru
    const newVaccination = new this.vaccinationModel({
      name,
      dateGiven,
      notes,
      patient: patientId,
      appointment: appointmentId,
      doctor, // Diambil dari appointment
      clinic, // Diambil dari appointment
    });

    return newVaccination.save();
  }
  async findForPatient(patientId: string): Promise<Vaccination[]> {
    return this.vaccinationModel
      .find({ patient: patientId })
      .sort({ dateGiven: 'desc' }) // Urutkan dari yang terbaru
      .exec();
  }
}