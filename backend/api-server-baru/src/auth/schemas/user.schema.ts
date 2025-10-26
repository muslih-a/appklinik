import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Clinic } from '../../clinics/schemas/clinic.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    required: true,
    enum: ['Admin', 'Doctor', 'Patient','AdminKlinik'],
    default: 'Patient',
  })
  role: string;
  
  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: false })
  clinic: Clinic;

  @Prop({ type: String, required: false })
  fcmToken?: string;
  
  @Prop({ type: String, required: false })
  address?: string;

  @Prop({ type: String, required: false })
  phoneNumber?: string;

  @Prop({ type: String, required: false, index: true }) // Buat index jika sering dicari
  expoPushToken?: string; // Tambahkan field ini

  // --- [FIELD BARU DITAMBAHKAN DI SINI] ---
  @Prop({ type: Date, required: false }) // Dibuat opsional, tapi wajib untuk pasien
  dateOfBirth?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<UserDocument>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});