import { Injectable, ConflictException, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { SignUpDto } from './dto/sign-up.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<{ token: string; user: Omit<User, 'password'> }> {
    const { name, email, password, clinicId, dateOfBirth } = signUpDto;
    try {
      const user = await this.userModel.create({
        name, email, password, role: 'Patient', clinic: clinicId, dateOfBirth,
      });
      const token = this.jwtService.sign({
        id: user._id, role: user.role, clinicId: user.clinic
      });
      const { password: _, ...result } = user.toObject();
      return { token, user: result };
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists.');
      }
      throw error;
    }
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userModel.findOne({ email });
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any): Promise<{ token: string }> {
    const payload = { id: user._id, role: user.role, clinicId: user.clinic, name: user.name };
    return {
      token: this.jwtService.sign(payload),
    };
  }

  async updateFcmToken(userId: string, fcmToken: string): Promise<User> {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { fcmToken: fcmToken } },
      { new: true },
    ).exec();
    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found.`);
    }
    return updatedUser;
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { fcmToken: null } },
    ).exec();
    return { message: 'Successfully logged out and cleared notification token.' };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateProfileDto },
      { new: true, select: '-password' },
    ).exec();
    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found.`);
    }
    return updatedUser;
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .populate('clinic')
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found.`);
    }
    return user;
  }
  
  async findAllByClinic(clinicId: string): Promise<User[]> {
    return this.userModel.find({ role: 'Doctor', clinic: clinicId }).select('-password').exec();
  }
  async saveExpoPushToken(userId: string, token: string): Promise<UserDocument> { // Gunakan UserDocument agar tipe lebih jelas
  this.logger.log(`Mencoba menyimpan Expo Push Token untuk user ${userId}`); // Tambahkan logger
  const user = await this.userModel.findByIdAndUpdate(
    userId,
    { $set: { expoPushToken: token } }, // Simpan ke field expoPushToken
    { new: true }
  ).select('-password').exec(); // Tambahkan exec()

  if (!user) {
    this.logger.error(`User ${userId} tidak ditemukan saat mencoba simpan expoPushToken`);
    throw new NotFoundException('User tidak ditemukan');
  }
  this.logger.log(`Expo Push Token berhasil disimpan untuk user ${userId}: ${token}`);
  return user;
  }
}