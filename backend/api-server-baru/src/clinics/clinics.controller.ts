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
  HttpCode,
  HttpStatus,
  Query,
  BadRequestException, // <-- Import BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Ganti 'src/' menjadi '../'
import { Roles } from '../auth/guards/roles.decorator'; // Ganti 'src/' menjadi '../'
import { RolesGuard } from '../auth/guards/roles.guard'; // Ganti 'src/' menjadi '../'
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { AssignDoctorDto } from './dto/assign-doctor.dto';
import { ScheduleClosingDto } from './dto/schedule-closing.dto';
// --- Hapus import DTO yang tidak dipakai ---
// import { UpdateNowServingDto } from './dto/update-now-serving.dto';
// ------------------------------------------

@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get('for-appointment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Patient')
  findAllForAppointment(@Request() req) {
    // Tambahkan validasi user
    if (!req.user?.id) throw new BadRequestException('User tidak valid');
    return this.clinicsService.findAllForAppointment(req.user);
  }

  @Get('public/queue')
  getPublicQueueData(@Query('key') key: string) {
    if (!key) throw new BadRequestException('Display key diperlukan.'); // Validasi input
    return this.clinicsService.getPublicQueueData(key);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin') // Hanya SuperAdmin
  create(@Body() createClinicDto: CreateClinicDto) {
    return this.clinicsService.create(createClinicDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin') // Hanya SuperAdmin
  findAll() {
    return this.clinicsService.findAll();
  }

  @Get(':id/patients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  // Sekarang bisa diakses AdminKlinik juga
  @Roles('Admin', 'Doctor', 'AdminKlinik')
  findPatients(@Param('id') id: string) {
    return this.clinicsService.findPatientsByClinic(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  // Semua role login bisa lihat detail klinik
  @Roles('Admin', 'Doctor', 'Patient', 'AdminKlinik')
  findOne(@Param('id') id: string) {
    return this.clinicsService.findOne(id);
  }

  @Patch(':id/assign-doctor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin') // Hanya SuperAdmin
  assignDoctor(
    @Param('id') clinicId: string,
    @Body() assignDoctorDto: AssignDoctorDto,
  ) {
    return this.clinicsService.assignDoctorToClinic(clinicId, assignDoctorDto.doctorId);
  }

  // --- [PERUBAHAN FASE 2 - LANGKAH 3] ---
  // Hapus seluruh endpoint updateNowServing
  // @Patch('my-clinic/now-serving')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('Doctor', 'AdminKlinik')
  // @HttpCode(HttpStatus.OK)
  // updateNowServing(
  //   @Request() req,
  //   @Body() updateNowServingDto: UpdateNowServingDto,
  // ) {
  //   // ... (kode dihapus) ...
  // }
  // ------------------------------------

  @Patch('my-clinic/close-registration-now')
  @UseGuards(JwtAuthGuard, RolesGuard)
  // Sekarang hanya AdminKlinik (atau Dokter jika masih perlu)
  @Roles('Doctor', 'AdminKlinik') // Sesuaikan role sesuai kebutuhan akhir
  closeRegistrationNow(@Request() req) {
     // Tambahkan validasi user
    if (!req.user?.id) throw new BadRequestException('User tidak valid');
    return this.clinicsService.closeRegistrationNow(req.user);
  }

  @Patch('my-clinic/open-registration')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Doctor', 'AdminKlinik') // Sesuaikan role
  openRegistration(@Request() req) {
     // Tambahkan validasi user
    if (!req.user?.id) throw new BadRequestException('User tidak valid');
    return this.clinicsService.openRegistration(req.user);
  }

  @Patch('my-clinic/schedule-closing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Doctor', 'AdminKlinik') // Sesuaikan role
  scheduleClosing(@Request() req, @Body() scheduleClosingDto: ScheduleClosingDto) {
     // Tambahkan validasi user
    if (!req.user?.id) throw new BadRequestException('User tidak valid');
    return this.clinicsService.scheduleClosing(req.user, scheduleClosingDto.closeTime);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  // Update klinik bisa oleh SuperAdmin, Dokter, AdminKlinik (terbatas kliniknya)
  @Roles('Admin', 'Doctor', 'AdminKlinik')
  update(@Param('id') id: string, @Body() updateClinicDto: CreateClinicDto, @Request() req) {
     // Tambahkan validasi user
    if (!req.user?.id || !req.user?.role) throw new BadRequestException('User tidak valid');

    if (req.user.role === 'Admin') {
      // SuperAdmin bisa update klinik mana saja
      return this.clinicsService.update(id, updateClinicDto);
    } else {
      // Dokter & AdminKlinik hanya bisa update kliniknya sendiri
      // Gunakan method yang sudah ada (updateByDoctor) atau buat method baru yg lebih generik
      return this.clinicsService.updateByDoctor(id, updateClinicDto, req.user);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin') // Hanya SuperAdmin
  remove(@Param('id') id: string) {
    return this.clinicsService.remove(id);
  }
}