import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ScheduledVaccination,
  ScheduledVaccinationDocument,
} from './schemas/scheduled-vaccination.schema';
import { CreateScheduledVaccinationDto } from './dto/create-scheduled-vaccination.dto';

// Definisikan tipe data untuk user dari token agar lebih aman
interface LoggedInUser {
  id: string;
  role: string;
  clinicId: string;
}

@Injectable()
export class ScheduledVaccinationsService {
  constructor(
    @InjectModel(ScheduledVaccination.name)
    private scheduledVaccinationModel: Model<ScheduledVaccinationDocument>,
  ) {}

  async create(
    createDto: CreateScheduledVaccinationDto,
    doctor: LoggedInUser, // Menggunakan tipe data yang lebih akurat
  ): Promise<ScheduledVaccination> {
    const { vaccineName, scheduledDate, patientId } = createDto;

    const newScheduledVaccination = new this.scheduledVaccinationModel({
      vaccineName,
      scheduledDate,
      patient: patientId,
      doctor: doctor.id, // <-- PERBAIKAN DI SINI
      clinic: doctor.clinicId, // <-- PERBAIKAN DI SINI
    });

    return newScheduledVaccination.save();
  }

  async findForPatient(patientId: string): Promise<ScheduledVaccination[]> {
    return this.scheduledVaccinationModel
      .find({
        patient: patientId,
        status: 'SCHEDULED',
        scheduledDate: { $gte: new Date() },
      })
      .sort({ scheduledDate: 'asc' })
      .exec();
  }
}