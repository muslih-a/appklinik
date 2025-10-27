import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Patch,
  Param,
  Query,
  ForbiddenException, // <-- Ditambahkan
  BadRequestException, // <-- Ditambahkan
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { RecordEmrDto } from './dto/record-emr.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles('Patient') // Hanya Pasien
  create(@Body() createAppointmentDto: CreateAppointmentDto, @Request() req) {
    // Validasi: Pastikan patientId di DTO sama dengan ID user yang login
    if (req.user?.id !== createAppointmentDto.patientId) {
      throw new ForbiddenException('Anda hanya bisa membuat janji temu untuk diri sendiri.');
    }
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get('my-appointment/today')
  @Roles('Patient') // Hanya Pasien
  findMyAppointmentToday(@Request() req) {
    // Validasi user
    if (!req.user?.id) throw new BadRequestException('User tidak valid');
    const patientId = req.user.id;
    return this.appointmentsService.findMyAppointmentForToday(patientId);
  }

  @Get('queue/active')
  @Roles('Doctor', 'AdminKlinik') // Dokter & AdminKlinik
  findMyActiveQueue(@Request() req) {
    if (!req.user?.clinicId) throw new ForbiddenException('User tidak terhubung dengan klinik.');
    const clinicId = req.user.clinicId;
    return this.appointmentsService.findActiveQueueForClinic(clinicId);
  }

  @Get('queue/on-hold')
  @Roles('Doctor', 'AdminKlinik') // Dokter & AdminKlinik
  findMyOnHoldQueue(@Request() req) {
    if (!req.user?.clinicId) throw new ForbiddenException('User tidak terhubung dengan klinik.');
    const clinicId = req.user.clinicId;
    return this.appointmentsService.findOnHoldQueueForClinic(clinicId);
  }

  @Get('queue/history')
  @Roles('Doctor', 'AdminKlinik') // Dokter & AdminKlinik
  findMyDailyHistory(@Request() req) {
    if (!req.user?.clinicId) throw new ForbiddenException('User tidak terhubung dengan klinik.');
    const clinicId = req.user.clinicId;
    return this.appointmentsService.findDailyHistoryForClinic(clinicId);
  }

  @Get('schedule/my')
  @Roles('Doctor', 'AdminKlinik') // Dokter & AdminKlinik
  findScheduleForDoctor(
    @Request() req,
    @Query('startDate') startDate: Date | string, // Terima string juga
    @Query('endDate') endDate: Date | string,   // Terima string juga
  ) {
    // Validasi tanggal
    if (!startDate || !endDate) throw new BadRequestException('Parameter startDate dan endDate diperlukan.');
    // Konversi ke Date di sini
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Format tanggal tidak valid.');
    }
    return this.appointmentsService.findScheduleForDoctor(
      req.user, // Kirim user object
      start,
      end,
    );
  }

  @Get('history')
  @Roles('Doctor', 'AdminKlinik') // Dokter & AdminKlinik
  findHistoryForDoctor(
    @Request() req,
    @Query('status') status: string,
    @Query('startDate') startDate: Date | string, // Terima string juga
    @Query('endDate') endDate: Date | string,   // Terima string juga
  ) {
    // Validasi tanggal jika ada
    const start = startDate ? (startDate instanceof Date ? startDate : new Date(startDate)) : undefined;
    const end = endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : undefined;
    if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime()))) {
        throw new BadRequestException('Format tanggal tidak valid.');
    }
    return this.appointmentsService.findHistoryForDoctor(
      req.user,
      status,
      start,
      end,
    );
  }

  @Get('history/my')
  @Roles('Patient') // Hanya Pasien
  findMyHistory(@Request() req) {
    if (!req.user?.id) throw new BadRequestException('User tidak valid');
    const patientId = req.user.id;
    return this.appointmentsService.findForPatient(patientId);
  }

  @Patch(':id/cancel')
  @Roles('Patient') // Hanya Pasien
  cancelAppointment(@Param('id') id: string, @Request() req) {
    if (!req.user?.id) throw new BadRequestException('User tidak valid');
    const patientId = req.user.id;
    return this.appointmentsService.cancelByUser(id, patientId);
  }

  // --- [PERUBAHAN DI SINI] ---
  @Patch(':id/status')
  // Roles umum yang diizinkan: Dokter atau AdminKlinik
  @Roles('Doctor', 'AdminKlinik')
  updateStatus(
    @Param('id') id: string,
    @Body() updateAppointmentStatusDto: UpdateAppointmentStatusDto,
    @Request() req, // Tambahkan @Request untuk mendapatkan info user
  ) {
    // Pastikan user ada di request
    if (!req.user?.role) {
       throw new BadRequestException('Informasi user tidak ditemukan.');
    }
    const userRole = req.user.role;
    const requestedStatus = updateAppointmentStatusDto.status;

    // Status yang hanya boleh diubah oleh AdminKlinik
    const adminOnlyStatuses = ['WAITING', 'SKIPPED', 'ON_HOLD'];
    // Status yang hanya boleh diubah oleh Dokter
    const doctorOnlyStatuses = ['IN_PROGRESS', 'COMPLETED'];

    // Validasi role berdasarkan status yang diminta
    if (adminOnlyStatuses.includes(requestedStatus) && userRole !== 'AdminKlinik') {
      throw new ForbiddenException(`Hanya Admin Klinik yang bisa mengubah status menjadi ${requestedStatus}.`);
    }

    if (doctorOnlyStatuses.includes(requestedStatus) && userRole !== 'Doctor') {
      throw new ForbiddenException(`Hanya Dokter yang bisa mengubah status menjadi ${requestedStatus}.`);
    }

    // Jika status tidak termasuk dalam validasi di atas (misal status typo?), bisa tambahkan pengecekan lain
    const allowedStatuses = [...adminOnlyStatuses, ...doctorOnlyStatuses];
    if (!allowedStatuses.includes(requestedStatus)) {
        throw new BadRequestException(`Status "${requestedStatus}" tidak valid.`);
    }


    // Jika lolos validasi, panggil service
    return this.appointmentsService.updateStatus(id, updateAppointmentStatusDto);
  }
  // --- [AKHIR PERUBAHAN] ---

  @Patch(':id/emr')
  @Roles('Doctor', 'AdminKlinik') // EMR bisa diisi Dokter atau AdminKlinik
  recordEmr(
    @Param('id') id: string,
    @Body() recordEmrDto: RecordEmrDto,
  ) {
    // Pertimbangkan validasi EMR DTO di sini jika perlu
    return this.appointmentsService.recordEmr(id, recordEmrDto);
  }
}