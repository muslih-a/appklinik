import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Appointment,
  AppointmentDocument,
} from '../appointments/schemas/appointment.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async getBillingReport(
    clinicId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Bangun query dasar
    const query: any = {
      status: 'COMPLETED',
    };

    // Tambahkan filter berdasarkan klinik jika ada
    if (clinicId) {
      query.clinic = clinicId;
    }

    // Tambahkan filter berdasarkan rentang tanggal jika ada
    if (startDate && endDate) {
      // Set jam akhir ke 23:59:59 untuk mencakup seluruh hari
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.appointmentTime = { $gte: new Date(startDate), $lte: endOfDay };
    }
    
    const results = await this.appointmentModel
      .find(query)
      .populate('patient', 'name') // Ambil nama pasien
      .populate('doctor', 'name')  // Ambil nama dokter
      .sort({ appointmentTime: -1 })
      .exec();

    return {
      count: results.length,
      data: results,
    };
  }
}