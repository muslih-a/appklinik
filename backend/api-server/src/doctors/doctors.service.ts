import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<Omit<User, 'password'>> {
    const { name, email, password, clinicId } = createDoctorDto;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const newUser = new this.userModel({
      name,
      email,
      password,
      role: 'Doctor',
      clinic: clinicId,
    });

    const savedUser = await newUser.save();
    
    const userObject: User = savedUser.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = userObject;
    return result;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find({ role: 'Doctor' }).populate('clinic').exec();
  }

  async findAllByClinic(clinicId: string): Promise<User[]> {
    return this.userModel.find({ role: 'Doctor', clinic: clinicId }).exec();
  }

  async remove(id: string): Promise<User> {
    const deletedDoctor = await this.userModel.findOneAndDelete({ _id: id, role: 'Doctor' });

    if (!deletedDoctor) {
      throw new NotFoundException(`Doctor with ID "${id}" not found`);
    }
    return deletedDoctor;
  }
  
  async update(
    id: string,
    updateDoctorDto: UpdateDoctorDto,
  ): Promise<Omit<User, 'password'>> {
    if (updateDoctorDto.password) {
      updateDoctorDto.password = await bcrypt.hash(updateDoctorDto.password, 10);
    }
    
    const updatedUser = await this.userModel.findOneAndUpdate(
        { _id: id, role: 'Doctor' },
        { $set: updateDoctorDto },
        { new: true },
      ).exec();

    if (!updatedUser) {
      throw new NotFoundException(`Doctor with ID "${id}" not found`);
    }
    
    const userObject: User = updatedUser.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = userObject;
    return result;
  }
}