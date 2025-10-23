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
  Query,
  NotFoundException,
} from '@nestjs/common';
import { VaccinesService } from './vaccines.service';
import { CreateVaccineDto } from './dto/create-vaccine.dto';
import { UpdateVaccineDto } from './dto/update-vaccine.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('vaccines')
export class VaccinesController {
  constructor(private readonly vaccinesService: VaccinesService) {}

  @Post()
  create(@Body() createVaccineDto: CreateVaccineDto, @Request() req) {
    return this.vaccinesService.create(createVaccineDto, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.vaccinesService.findAll(req.user);
  }

  @Get('suggestions')
  findSuggestions(@Query('patientId') patientId: string, @Request() req) {
    if (!patientId) {
      throw new NotFoundException('Patient ID harus disertakan.');
    }
    return this.vaccinesService.findSuggestions(patientId, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vaccinesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVaccineDto: UpdateVaccineDto) {
    return this.vaccinesService.update(id, updateVaccineDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vaccinesService.remove(id);
  }
}