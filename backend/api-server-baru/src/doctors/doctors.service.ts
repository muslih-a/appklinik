import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { CreateUserByAdminDto } from '../auth/dto/create-user-by-admin.dto';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserByAdminDto): Promise<Omit<User, 'password'>> {
    const { name, email, password, clinicId, dateOfBirth, role } = createUserDto; 
    try {
      const user = await this.userModel.create({
        name, email, password, clinic: clinicId, dateOfBirth, role,
      });
      const { password: _, ...result } = user.toObject();
      return result;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists.');
      }
      throw error;
    }
  }

  async findAll(role?: string): Promise<User[]> {
    const filter = role ? { role } : {};
    return this.userModel.find(filter).select('-password').populate('clinic').exec();
  }

  async update(userId: string, updateUserDto: any): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    } else {
      delete updateUserDto.password;
    }
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateUserDto },
      { new: true, select: '-password' },
    ).exec();
    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found.`);
    }
    return updatedUser;
  }

  async remove(userId: string): Promise<User> {
    const deletedUser = await this.userModel.findByIdAndDelete(userId);
    if (!deletedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
    return deletedUser;
  }
}