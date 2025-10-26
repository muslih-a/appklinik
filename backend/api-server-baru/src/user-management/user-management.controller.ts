import { Controller, Post, Body, UseGuards, Get, Delete, Param, HttpCode, HttpStatus,Patch,BadRequestException, } from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { CreateAdminKlinikDto } from './dto/create-admin-klinik.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Guard JWT
import { RolesGuard } from '../auth/guards/roles.guard';     // Guard Roles
import { Roles } from '../auth/guards/roles.decorator';   // Decorator Roles
import { UpdateAdminKlinikDto } from './dto/update-admin-klinik.dto';

// Terapkan guard di level controller, hanya Admin (SuperAdmin) yang bisa akses
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
@Controller('user-management') // Base path untuk controller ini
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  // Endpoint untuk MEMBUAT Admin Klinik baru
  @Post('admin-klinik')
  @HttpCode(HttpStatus.CREATED) // Status 201 Created
  create(@Body() createAdminKlinikDto: CreateAdminKlinikDto) {
    return this.userManagementService.createAdminKlinik(createAdminKlinikDto);
  }

  // Endpoint untuk MELIHAT SEMUA Admin Klinik (Opsional)
  @Get('admin-klinik')
  findAll() {
    return this.userManagementService.findAllAdminKlinik();
  }

  // Endpoint untuk MENGHAPUS Admin Klinik (Opsional)
  @Delete('admin-klinik/:id')
  @HttpCode(HttpStatus.OK) // Status 200 OK
  remove(@Param('id') id: string) {
    return this.userManagementService.removeAdminKlinik(id);
  }
  @Patch('admin-klinik/:id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAdminKlinikDto
  ) {
    // Pastikan body tidak kosong
    if (Object.keys(updateDto).length === 0) {
      throw new BadRequestException('Update data tidak boleh kosong.');
    }
    return this.userManagementService.updateAdminKlinik(id, updateDto);
  }

}