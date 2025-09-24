import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post()
  @Roles('Admin')
  create(@Body() createClinicDto: CreateClinicDto) {
    return this.clinicsService.create(createClinicDto);
  }

  @Get()
  @Roles('Admin')
  findAll() {
    return this.clinicsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clinicsService.findOne(id);
  }
  
  // --- ENDPOINT BARU DITAMBAHKAN DI SINI ---
  @Get(':id/patients')
  @Roles('Admin', 'Doctor') // Hanya Admin dan Dokter yang bisa mengakses
  findPatients(@Param('id') id: string) {
    return this.clinicsService.findPatientsByClinic(id);
  }

  @Patch(':id')
  @Roles('Admin', 'Doctor')
  update(@Param('id') id: string, @Body() updateClinicDto: CreateClinicDto, @Request() req) {
    if (req.user.role === 'Admin') {
      return this.clinicsService.update(id, updateClinicDto);
    } else {
      return this.clinicsService.updateByDoctor(id, updateClinicDto, req.user);
    }
  }

  @Delete(':id')
  @Roles('Admin')
  remove(@Param('id') id: string) {
    return this.clinicsService.remove(id);
  }
}