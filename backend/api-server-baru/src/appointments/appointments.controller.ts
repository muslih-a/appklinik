import { Controller, Post, Body, UseGuards, Get, Request, Patch, Param, Query } from '@nestjs/common';
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
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get('my-appointment/today')
  findMyAppointmentToday(@Request() req) {
    const patientId = req.user.id;
    return this.appointmentsService.findMyAppointmentForToday(patientId);
  }

  @Get('queue/active')
  findMyActiveQueue(@Request() req) {
    const clinicId = req.user.clinicId;
    return this.appointmentsService.findActiveQueueForClinic(clinicId);
  }

  @Get('queue/on-hold')
  findMyOnHoldQueue(@Request() req) {
    const clinicId = req.user.clinicId;
    return this.appointmentsService.findOnHoldQueueForClinic(clinicId);
  }

  @Get('queue/history')
  findMyDailyHistory(@Request() req) {
    const clinicId = req.user.clinicId;
    return this.appointmentsService.findDailyHistoryForClinic(clinicId);
  }

  @Get('schedule/my')
  @Roles('Doctor')
  findScheduleForDoctor(
    @Request() req,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.appointmentsService.findScheduleForDoctor(
      req.user,
      startDate,
      endDate,
    );
  }

  @Get('history')
  @Roles('Doctor')
  findHistoryForDoctor(
    @Request() req,
    @Query('status') status: string,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.appointmentsService.findHistoryForDoctor(
      req.user,
      status,
      startDate,
      endDate,
    );
  }
  
  @Get('history/my')
  findMyHistory(@Request() req) {
    const patientId = req.user.id;
    return this.appointmentsService.findForPatient(patientId);
  }

  @Patch(':id/cancel')
  cancelAppointment(@Param('id') id: string, @Request() req) {
    const patientId = req.user.id;
    return this.appointmentsService.cancelByUser(id, patientId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateAppointmentStatusDto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, updateAppointmentStatusDto);
  }

  @Patch(':id/emr')
  recordEmr(
    @Param('id') id: string,
    @Body() recordEmrDto: RecordEmrDto,
  ) {
    return this.appointmentsService.recordEmr(id, recordEmrDto);
  }
}