import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import {
  Appointment,
  AppointmentDocument,
} from '../appointments/schemas/appointment.schema';
// --- Path diperbaiki sesuai screenshot untuk riwayat vaksinasi ---
import {
  Vaccination,
  VaccinationDocument,
} from '../vaccinations/schemas/vaccination.schema';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    // --- Model diperbaiki untuk riwayat vaksinasi ---
    @InjectModel(Vaccination.name)
    private vaccinationModel: Model<VaccinationDocument>,
  ) {}

  async findPatientHistory(patientId: string) {
    const [user, appointments, vaccinations] = await Promise.all([
      this.userModel.findById(patientId).select('-password').exec(),
      this.appointmentModel
        .find({ patient: patientId })
        .populate('doctor', 'name')
        .sort({ appointmentTime: -1 })
        .exec(),
      // --- Logika diperbaiki untuk riwayat vaksinasi ---
      this.vaccinationModel
        .find({ patient: patientId })
        .sort({ dateGiven: -1 }) // Asumsi nama field-nya 'dateGiven'
        .exec(),
    ]);

    if (!user) {
      throw new NotFoundException(`Patient with ID "${patientId}" not found.`);
    }

    return {
      profile: user,
      appointments: appointments,
      vaccinations: vaccinations,
    };
  }
}