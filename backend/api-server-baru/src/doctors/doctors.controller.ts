import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateUserByAdminDto } from '../auth/dto/create-user-by-admin.dto';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard) // Lindungi semua endpoint di controller ini
@Roles('Admin') // Hanya Admin yang bisa mengakses
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  create(@Body() createUserDto: CreateUserByAdminDto) {
    return this.doctorsService.create(createUserDto);
  }

  @Get()
  findAll(@Query('role') role?: string) {
    return this.doctorsService.findAll(role);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateProfileDto) {
    return this.doctorsService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }
}