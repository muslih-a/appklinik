import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { Clinic } from '../../clinics/schemas/clinic.schema';
import { Appointment } from '../../appointments/schemas/appointment.schema';

export type VaccinationDocument = Vaccination & Document;

@Schema({ timestamps: true })
export class Vaccination {
  @Prop({ required: true })
  name: string; // Nama vaksin, misal: "Polio"

  @Prop({ required: true })
  dateGiven: Date; // Tanggal vaksin diberikan

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patient: User; // Pasien yang menerima

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  doctor: User; // Dokter yang memberikan

  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
  clinic: Clinic; // Klinik tempat vaksin diberikan

  @Prop({ type: Types.ObjectId, ref: 'Appointment', required: true })
  appointment: Appointment; // Terkait dengan janji temu yang mana

  @Prop()
  notes?: string; // Catatan opsional, misal: nomor batch
}

export const VaccinationSchema = SchemaFactory.createForClass(Vaccination);