import { Controller, Post, Body, UseGuards, Request, Patch, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() signUpDto: SignUpDto): Promise<{ token: string; user: any }> {
    return this.authService.signUp(signUpDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req): Promise<any> {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('fcm-token')
  updateFcmToken(@Request() req, @Body('fcmToken') fcmToken: string) {
    const userId = req.user.id;
    return this.authService.updateFcmToken(userId, fcmToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Request() req) {
    const userId = req.user.id;
    return this.authService.logout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile/me')
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const userId = req.user.id;
    return this.authService.updateProfile(userId, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/me')
  getProfile(@Request() req) {
    const userId = req.user.id;
    return this.authService.getProfile(req.user.id);
  }
  
  // Endpoint untuk pasien mengambil daftar dokter di klinik tertentu
  @Get('/by-clinic/:clinicId')
  @UseGuards(JwtAuthGuard)
  findAllByClinic(@Param('clinicId') clinicId: string) {
    return this.authService.findAllByClinic(clinicId);
  }
}