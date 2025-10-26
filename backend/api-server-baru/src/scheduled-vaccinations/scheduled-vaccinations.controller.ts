import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ScheduledVaccinationsService } from './scheduled-vaccinations.service';
import { CreateScheduledVaccinationDto } from './dto/create-scheduled-vaccination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

@Controller('scheduled-vaccinations')
export class ScheduledVaccinationsController {
  constructor(
    private readonly scheduledVaccinationsService: ScheduledVaccinationsService,
  ) {}

  // Endpoint ini HANYA untuk DOKTER
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Doctor', 'AdminKlinik')
  @Post()
  create(@Request() req, @Body() createDto: CreateScheduledVaccinationDto) {
    // Kita teruskan data dokter dari token login ke service
    return this.scheduledVaccinationsService.create(createDto, req.user);
  }

  // Endpoint ini untuk PASIEN yang sudah login
  @UseGuards(JwtAuthGuard)
  @Get('my-schedule')
  findMySchedule(@Request() req) {
    const patientId = req.user.id; // Ambil ID pasien dari token
    return this.scheduledVaccinationsService.findForPatient(patientId);
  }
}