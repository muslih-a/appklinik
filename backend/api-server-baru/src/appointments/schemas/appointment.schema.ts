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
      'ON_HOLD', // <-- Status baru ditambahkan
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
  
  @Prop({ required: false })
  consultationStartTime?: Date;

  @Prop({ required: false })
  consultationEndTime?: Date;

  @Prop({ type: Boolean, default: false })
  isRealtimeReminderSent: boolean;
  
  // --- [FIELD BARU] ---
  @Prop({ type: Date, required: false })
  onHoldTime?: Date; // Waktu saat pasien masuk antrean on hold
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);