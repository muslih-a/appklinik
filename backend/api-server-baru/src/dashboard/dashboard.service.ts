import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Clinic, ClinicDocument } from '../clinics/schemas/clinic.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import {
  Appointment,
  AppointmentDocument,
} from '../appointments/schemas/appointment.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Clinic.name) private clinicModel: Model<ClinicDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async getAdminStats() {
    const [
      totalClinics,
      totalDoctors,
      totalPatients,
      totalCompletedAppointments,
    ] = await Promise.all([
      this.clinicModel.countDocuments().exec(),
      this.userModel.countDocuments({ role: 'Doctor' }).exec(),
      this.userModel.countDocuments({ role: 'Patient' }).exec(),
      this.appointmentModel.countDocuments({ status: 'COMPLETED' }).exec(),
    ]);

    return {
      totalClinics,
      totalDoctors,
      totalPatients,
      totalCompletedAppointments,
    };
  }
}