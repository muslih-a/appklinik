import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingDocument = Setting & Document;

@Schema({ timestamps: true })
export class Setting {
  @Prop({ type: String, required: true, unique: true, default: 'main' })
  key: string; // Identifier for the settings document, we'll only have one.

  @Prop({ type: Boolean, default: true })
  isScheduledReminderActive: boolean;

  @Prop({ type: String, default: '17:00' }) // Default jam 5 sore
  h1ReminderTime: string;

  @Prop({ type: String, default: '07:00' }) // Default jam 7 pagi
  dayHReminderTime: string;

  // --- FIELD BARU DITAMBAHKAN DI SINI ---
  @Prop({ type: Number, default: 15 }) // Default 15 menit
  realtimeReminderThreshold: number;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);