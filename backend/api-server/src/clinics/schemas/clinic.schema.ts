import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClinicDocument = Clinic & Document;

@Schema({ timestamps: true })
export class Clinic {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  phoneNumber: string;

  @Prop({ required: false })
  operatingHours?: string;

  // --- TAMBAHAN BARU UNTUK ESTIMASI WAKTU ---
  @Prop({ required: false, type: Number, default: 15 })
  averageConsultationTime?: number; // Disimpan dalam satuan menit
}

export const ClinicSchema = SchemaFactory.createForClass(Clinic);