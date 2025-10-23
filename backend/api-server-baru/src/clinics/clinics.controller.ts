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
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/guards/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
// --- [PENAMBAHAN] Impor DTO baru ---
import { AssignDoctorDto } from './dto/assign-doctor.dto'; 
import { ScheduleClosingDto } from './dto/schedule-closing.dto';
import { UpdateNowServingDto } from './dto/update-now-serving.dto';

@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get('for-appointment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Patient')
  findAllForAppointment(@Request() req) {
    return this.clinicsService.findAllForAppointment(req.user);
  }

  @Get('public/queue')
  getPublicQueueData(@Query('key') key: string) {
    return this.clinicsService.getPublicQueueData(key);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  create(@Body() createClinicDto: CreateClinicDto) {
    return this.clinicsService.create(createClinicDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  findAll() {
    return this.clinicsService.findAll();
  }

  @Get(':id/patients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Doctor')
  findPatients(@Param('id') id: string) {
    return this.clinicsService.findPatientsByClinic(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Doctor', 'Patient')
  findOne(@Param('id') id: string) {
    return this.clinicsService.findOne(id);
  }
  
  // --- [ENDPOINT BARU UNTUK TUGASKAN DOKTER] ---
  @Patch(':id/assign-doctor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  assignDoctor(
    @Param('id') clinicId: string,
    @Body() assignDoctorDto: AssignDoctorDto,
  ) {
    return this.clinicsService.assignDoctorToClinic(clinicId, assignDoctorDto.doctorId);
  }
  // ---------------------------------------------

  @Patch('my-clinic/now-serving')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Doctor')
  @HttpCode(HttpStatus.OK)
  updateNowServing(
    @Request() req,
    @Body() updateNowServingDto: UpdateNowServingDto,
  ) {
    return this.clinicsService.updateNowServing(
      req.user,
      updateNowServingDto.queueNumber,
    );
  }

  @Patch('my-clinic/close-registration-now')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Doctor')
  closeRegistrationNow(@Request() req) {
    return this.clinicsService.closeRegistrationNow(req.user);
  }

  @Patch('my-clinic/open-registration')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Doctor')
  openRegistration(@Request() req) {
    return this.clinicsService.openRegistration(req.user);
  }

  @Patch('my-clinic/schedule-closing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Doctor')
  scheduleClosing(@Request() req, @Body() scheduleClosingDto: ScheduleClosingDto) {
    return this.clinicsService.scheduleClosing(req.user, scheduleClosingDto.closeTime);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Doctor')
  update(@Param('id') id: string, @Body() updateClinicDto: CreateClinicDto, @Request() req) {
    if (req.user.role === 'Admin') {
      return this.clinicsService.update(id, updateClinicDto);
    } else {
      return this.clinicsService.updateByDoctor(id, updateClinicDto, req.user);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  remove(@Param('id') id: string) {
    return this.clinicsService.remove(id);
  }
}