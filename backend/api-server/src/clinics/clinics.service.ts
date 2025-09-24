import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { Clinic, ClinicDocument } from './schemas/clinic.schema';
// --- 1. Impor Model Pengguna (User) ---
import { User, UserDocument } from '../auth/schemas/user.schema';

// Definisikan tipe data untuk pengguna yang login (dari token)
interface AuthenticatedUser {
  id: string;
  role: string;
  clinicId: string;
}

@Injectable()
export class ClinicsService {
  constructor(
    @InjectModel(Clinic.name) private clinicModel: Model<ClinicDocument>,
    // --- 2. Suntikkan UserModel ke dalam constructor ---
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  // ... (fungsi create, findAll, findOne, update, updateByDoctor, remove tidak berubah)

  async create(createClinicDto: CreateClinicDto): Promise<Clinic> {
    const newClinic = new this.clinicModel(createClinicDto);
    return newClinic.save();
  }

  async findAll(): Promise<Clinic[]> {
    return this.clinicModel.find().exec();
  }

  async findOne(id: string): Promise<Clinic> {
    const clinic = await this.clinicModel.findById(id).exec();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID "${id}" not found.`);
    }
    return clinic;
  }

  async update(id: string, updateClinicDto: CreateClinicDto): Promise<Clinic> {
    const updatedClinic = await this.clinicModel
      .findByIdAndUpdate(id, updateClinicDto, { new: true })
      .exec();
    if (!updatedClinic) {
      throw new NotFoundException(`Clinic with ID "${id}" not found.`);
    }
    return updatedClinic;
  }

  async updateByDoctor(id: string, updateClinicDto: CreateClinicDto, user: AuthenticatedUser):
  Promise<Clinic> {
    if (user.clinicId?.toString() !== id) {
      throw new ForbiddenException('Anda tidak berhak memperbarui klinik ini.');
    }
    const updatedClinic = await this.clinicModel
      .findByIdAndUpdate(id, updateClinicDto, { new: true })
      .exec();
    if (!updatedClinic) {
      throw new NotFoundException(`Clinic with ID "${id}" not found.`);
    }
    return updatedClinic;
  }
  
  async remove(id: string): Promise<Clinic> {
    const deletedClinic = await this.clinicModel.findByIdAndDelete(id).exec();
    if (!deletedClinic) {
      throw new NotFoundException(`Clinic with ID "${id}" not found.`);
    }
    return deletedClinic;
  }

  // --- 3. FUNGSI BARU DITAMBAHKAN DI SINI ---
  async findPatientsByClinic(clinicId: string): Promise<User[]> {
    return this.userModel
      .find({ clinic: clinicId, role: 'Patient' })
      .select('-password') // Jangan sertakan password demi keamanan
      .exec();
  }
}