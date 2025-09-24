import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { Clinic } from '../../clinics/schemas/clinic.schema';

export type ScheduledVaccinationDocument = ScheduledVaccination & Document;

@Schema({ timestamps: true })
export class ScheduledVaccination {
  @Prop({ required: true })
  vaccineName: string; // Nama vaksin yang dijadwalkan

  @Prop({ required: true })
  scheduledDate: Date; // Tanggal jadwal vaksin

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patient: User; // Pasien yang dijadwalkan

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  doctor: User; // Dokter yang menjadwalkan

  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
  clinic: Clinic; // Klinik tempat jadwal dibuat

  @Prop({
    required: true,
    enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
    default: 'SCHEDULED',
  })
  status: string; // Status jadwal (dijadwalkan, selesai, batal)
}

export const ScheduledVaccinationSchema = SchemaFactory.createForClass(
  ScheduledVaccination,
);