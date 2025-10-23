import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
// --- 1. Impor Skema Klinik ---
import { Clinic } from '../../clinics/schemas/clinic.schema';

export type VaccineDocument = Vaccine & Document;

@Schema({ timestamps: true })
export class Vaccine {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: false, trim: true })
  description?: string;

  @Prop({ required: true })
  minAgeMonths: number;

  @Prop({ required: false })
  maxAgeMonths?: number;

  @Prop({ required: true, default: 1 })
  dosesRequired: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: User;

  // --- 2. Tambahkan Field untuk mengikat Vaksin ke Klinik ---
  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
  clinic: Clinic;
}

export const VaccineSchema = SchemaFactory.createForClass(Vaccine);