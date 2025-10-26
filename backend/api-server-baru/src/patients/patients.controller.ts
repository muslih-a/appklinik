import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get(':id/history')
  @Roles('Admin', 'Doctor', 'AdminKlinik') // Hanya Admin dan Dokter yang bisa mengakses
  findHistory(@Param('id') id: string) {
    return this.patientsService.findPatientHistory(id);
  }
}