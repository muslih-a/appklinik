import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vaccine, VaccineDocument } from './schemas/vaccine.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { CreateVaccineDto } from './dto/create-vaccine.dto';
import { UpdateVaccineDto } from './dto/update-vaccine.dto';

interface AuthenticatedUser {
  id: string;
  role: string;
  clinicId: string;
}

@Injectable()
export class VaccinesService {
  constructor(
    @InjectModel(Vaccine.name) private vaccineModel: Model<VaccineDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(
    createVaccineDto: CreateVaccineDto,
    user: AuthenticatedUser,
  ): Promise<Vaccine> {
    const vaccineData: any = {
      ...createVaccineDto,
      createdBy: user.id,
    };

    if (user.role === 'Doctor') {
      if (!user.clinicId) {
        throw new ForbiddenException('Dokter harus terhubung dengan sebuah klinik.');
      }
      vaccineData.clinic = user.clinicId;
    } else if (user.role === 'Admin') {
      vaccineData.clinic = createVaccineDto.clinicId;
    }

    const newVaccine = new this.vaccineModel(vaccineData);
    return newVaccine.save();
  }

  async findAll(user: AuthenticatedUser): Promise<Vaccine[]> {
    // console.log('--- [VaccinesService] findAll dipanggil oleh user:', user.role);

    if (user.role === 'Admin') {
      // console.log('Status: Pengguna adalah ADMIN. Menjalankan query `find()`...');
      
      // Ambil hasil query dan log sebelum dikembalikan
      const allVaccines = await this.vaccineModel.find().exec();
      
      // console.log(`Hasil Query Database: Ditemukan ${allVaccines.length} dokumen.`);
      // console.log('Data:', allVaccines); // Cetak datanya
      
      return allVaccines;
    }
    
    // Logika untuk Dokter (tidak berubah)
    if (!user.clinicId) {
       throw new ForbiddenException('Anda tidak terhubung dengan klinik manapun.');
    }
    const query = { $or: [{ clinic: user.clinicId }, { clinic: null }] };
    return this.vaccineModel.find(query).exec();
  }

  async findSuggestions(patientId: string, user: AuthenticatedUser): Promise<Vaccine[]> {
    const patient = await this.userModel.findById(patientId);
    if (!patient || !patient.dateOfBirth) {
      throw new NotFoundException(
        'Data pasien atau tanggal lahir tidak ditemukan.',
      );
    }

    const targetClinicId = patient.clinic;
    if (!targetClinicId) {
        throw new NotFoundException('Pasien tidak terdaftar di klinik manapun.');
    }

    const birthDate = new Date(patient.dateOfBirth);
    const today = new Date();
    const ageInMonths =
      (today.getFullYear() - birthDate.getFullYear()) * 12 +
      (today.getMonth() - birthDate.getMonth());

    return this.vaccineModel
      .find({
        $and: [
          { $or: [{ clinic: targetClinicId }, { clinic: null }] },
          { minAgeMonths: { $lte: ageInMonths } },
          {
            $or: [
              { maxAgeMonths: { $gte: ageInMonths } },
              { maxAgeMonths: { $exists: false } },
            ],
          },
        ],
      })
      .exec();
  }

  async findOne(id: string): Promise<Vaccine> {
    const vaccine = await this.vaccineModel.findById(id).exec();
    if (!vaccine) {
      throw new NotFoundException(`Vaksin dengan ID "${id}" tidak ditemukan.`);
    }
    return vaccine;
  }

  async update(id: string, updateVaccineDto: UpdateVaccineDto): Promise<Vaccine> {
    const updatedVaccine = await this.vaccineModel
      .findByIdAndUpdate(id, updateVaccineDto, { new: true })
      .exec();
    if (!updatedVaccine) {
      throw new NotFoundException(`Vaksin dengan ID "${id}" tidak ditemukan.`);
    }
    return updatedVaccine;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.vaccineModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Vaksin dengan ID "${id}" tidak ditemukan.`);
    }
    return { message: 'Vaksin berhasil dihapus.' };
  }
}