import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose'; // 1. Impor mongoose
import { User } from '../../auth/schemas/user.schema'; // 2. Impor skema User
import { randomUUID } from 'crypto';

// Menggunakan tipe Document generik dari Mongoose
export type ClinicDocument = Clinic & mongoose.Document;

@Schema({ timestamps: true })
export class Clinic {
  @Prop({ required: true, unique: true })
  name: string;

  // --- [FIELD BARU DITAMBAHKAN DI SINI] ---
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  doctor: User;
  // -----------------------------------------

  @Prop({ required: true })
  address: string;

  @Prop()
  phoneNumber: string;

  @Prop({ required: false, type: String, default: '08:00' })
  openingTime?: string;

  @Prop({ required: false, type: Number, default: 15 })
  averageConsultationTime?: number;

  @Prop({ required: false, type: Boolean, default: false })
  isRegistrationClosed?: boolean;

  @Prop({ required: false, type: Date })
  registrationCloseTime?: Date;

  // @Prop({ type: Number, default: 0 })
  // nowServing: number;

  @Prop({
    type: String,
    unique: true,
    default: () => randomUUID(),
    index: true,
  })
  displayKey: string;
}

export const ClinicSchema = SchemaFactory.createForClass(Clinic);

