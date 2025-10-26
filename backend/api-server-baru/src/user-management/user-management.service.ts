import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose'; // Import Types
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Clinic, ClinicDocument } from '../clinics/schemas/clinic.schema';
import { CreateAdminKlinikDto } from './dto/create-admin-klinik.dto';
import { UpdateAdminKlinikDto } from './dto/update-admin-klinik.dto'; // <-- Impor DTO Update
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserManagementService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Clinic.name) private clinicModel: Model<ClinicDocument>,
  ) {}

  // --- Membuat Admin Klinik Baru ---
  async createAdminKlinik(createDto: CreateAdminKlinikDto): Promise<Omit<User, 'password'>> {
    const { name, email, password, clinicId } = createDto;

    // 1. Validasi apakah clinicId valid dan ada
    if (!Types.ObjectId.isValid(clinicId)) {
        throw new BadRequestException('Format ID Klinik tidak valid.');
    }
    const clinicExists = await this.clinicModel.findById(clinicId).exec();
    if (!clinicExists) {
      throw new NotFoundException(`Klinik dengan ID "${clinicId}" tidak ditemukan.`);
    }

    // 2. Cek apakah email sudah terdaftar
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar.');
    }

    // 3. Hash password (di-handle oleh pre-save hook)

    // 4. Buat user baru
    try {
      const newUser = new this.userModel({
        name,
        email,
        password, // Password akan di-hash oleh pre-save hook
        role: 'AdminKlinik', // Set role baru
        clinic: clinicExists._id, // Assign ke clinic yang valid
      });
      const savedUser = await newUser.save();

      // 5. Kembalikan data user tanpa password
      const { password: _, ...result } = savedUser.toObject();
      return result;
    } catch (error) {
       // Tangani potensi error lain saat menyimpan
       console.error("Error creating AdminKlinik:", error);
       throw new BadRequestException('Gagal membuat user Admin Klinik.');
    }
  }

  // --- Menampilkan daftar Admin Klinik ---
  async findAllAdminKlinik(): Promise<Omit<User, 'password'>[]> {
    return this.userModel
      .find({ role: 'AdminKlinik' })
      .populate('clinic', 'name') // Tampilkan nama klinik
      .select('-password') // Jangan tampilkan password
      .exec();
  }

  // --- Menghapus Admin Klinik ---
  async removeAdminKlinik(id: string): Promise<{ message: string }> {
     if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Format ID User tidak valid.');
    }
    const result = await this.userModel.deleteOne({ _id: id, role: 'AdminKlinik' }).exec();
    if (result.deletedCount === 0) {
        throw new NotFoundException(`Admin Klinik dengan ID "${id}" tidak ditemukan.`);
    }
    return { message: 'Admin Klinik berhasil dihapus.' };
  }

  // --- Mengupdate Admin Klinik ---
  async updateAdminKlinik(id: string, updateDto: UpdateAdminKlinikDto): Promise<Omit<User, 'password'>> {
    // 1. Validasi ID user
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Format ID User tidak valid.');
    }

    // 2. Cari user dan pastikan role-nya AdminKlinik
    const userToUpdate = await this.userModel.findOne({ _id: id, role: 'AdminKlinik' }).exec();
    if (!userToUpdate) {
      throw new NotFoundException(`Admin Klinik dengan ID "${id}" tidak ditemukan.`);
    }

    // 3. Siapkan payload update
    const updatePayload: Partial<User> = {};

    if (updateDto.name) {
      updatePayload.name = updateDto.name;
    }

    // 4. Validasi clinicId baru jika ada
    if (updateDto.clinicId) {
      if (!Types.ObjectId.isValid(updateDto.clinicId)) {
        throw new BadRequestException('Format ID Klinik baru tidak valid.');
      }
      const clinicExists = await this.clinicModel.findById(updateDto.clinicId).exec();
      if (!clinicExists) {
        throw new NotFoundException(`Klinik baru dengan ID "${updateDto.clinicId}" tidak ditemukan.`);
      }
      updatePayload.clinic = clinicExists.id; // Gunakan ObjectId
    }

    // 5. Handle update password jika ada (akan di-hash oleh pre-save hook)
    if (updateDto.password) {
       // Cukup set password baru, hook akan hash sebelum save
       userToUpdate.password = updateDto.password;
       // Tandai bahwa password dimodifikasi agar hook Mongoose tahu
       userToUpdate.markModified('password');
    }

    // 6. Terapkan update untuk field selain password
    // (Merge payload ke user document)
    Object.assign(userToUpdate, updatePayload);


    // 7. Simpan perubahan (memanggil pre-save hook jika password berubah)
    try {
      const updatedUser = await userToUpdate.save();
      const { password: _, ...result } = updatedUser.toObject();
      return result;
    } catch (error: any) { // Tangkap error
       console.error("Error updating AdminKlinik:", error);
       // Cek jika error karena duplikasi email (meskipun kita tidak ubah email di sini, just in case)
       if (error.code === 11000) {
           throw new ConflictException('Terjadi konflik data, mungkin email sudah ada.');
       }
       throw new BadRequestException(`Gagal mengupdate user Admin Klinik: ${error.message}`);
    }
  }
}