import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { Clinic } from '../../clinics/schemas/clinic.schema';

export type AppointmentDocument = Appointment & Document;

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patient: User;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  doctor: User;

  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
  clinic: Clinic;

  @Prop({ required: true })
  appointmentTime: Date;

  @Prop({ required: true })
  queueNumber: number;

  @Prop({
    required: true,
    enum: [
      'SCHEDULED',
      'WAITING',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'SKIPPED',
    ],
    default: 'SCHEDULED',
  })
  status: string;

  @Prop()
  symptoms?: string;

  @Prop()
  diagnosis?: string;

  @Prop()
  treatment?: string;

  // --- TAMBAHAN BARU UNTUK MENCATAT DURASI ---
  @Prop({ required: false })
  consultationStartTime?: Date; // Waktu saat status diubah ke IN_PROGRESS

  @Prop({ required: false })
  consultationEndTime?: Date; // Waktu saat status diubah ke COMPLETED
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);