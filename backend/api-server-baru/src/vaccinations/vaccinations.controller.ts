import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { VaccinationsService } from './vaccinations.service';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

@Controller('vaccinations')
export class VaccinationsController {
  constructor(private readonly vaccinationsService: VaccinationsService) {}

  // Endpoint ini HANYA untuk DOKTER
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Doctor')
  @Post()
  create(@Body() createVaccinationDto: CreateVaccinationDto) {
    return this.vaccinationsService.create(createVaccinationDto);
  }

  // Endpoint ini untuk PASIEN yang sudah login
  @UseGuards(JwtAuthGuard)
  @Get('history/my')
  findMyHistory(@Request() req) {
    const patientId = req.user.id; // Ambil ID pasien dari token
    return this.vaccinationsService.findForPatient(patientId);
  }
}