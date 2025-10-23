import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from './schemas/setting.schema';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>,
  ) {}

  // Function to get the settings. If it doesn't exist, create it with default values.
  async getSettings(): Promise<Setting> {
    let settings = await this.settingModel.findOne({ key: 'main' }).exec();
    if (!settings) {
      // Create a default settings document if none exists
      settings = new this.settingModel();
      await settings.save();
    }
    return settings;
  }

  // Function to update the settings
  async updateSettings(dto: UpdateSettingDto): Promise<Setting> {
    return this.settingModel
      .findOneAndUpdate({ key: 'main' }, dto, {
        new: true, // Return the updated document
        upsert: true, // If it doesn't exist, create it
      })
      .exec();
  }
}