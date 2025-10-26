import { Controller, Post, Body, UseGuards, Request, Patch, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';

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

  @UseGuards(JwtAuthGuard) // Melindungi endpoint, hanya user login yang bisa akses
  @Post('save-push-token') // Atau bisa pakai @Put jika lebih sesuai
  @HttpCode(HttpStatus.OK) // Set status response ke 200 OK
  async savePushToken(
      @Request() req, // Untuk mendapatkan user ID dari JWT
      @Body('expoPushToken') token: string // Mengambil token dari body request
  ) {
      const userId = req.user.id; // Ambil user ID dari payload JWT
      if (!token) {
         // Anda perlu import BadRequestException dari @nestjs/common
         throw new BadRequestException('expoPushToken tidak boleh kosong'); // Validasi input
      }
      await this.authService.saveExpoPushToken(userId, token);
      return { message: 'Expo Push Token berhasil disimpan.' }; // Beri response sukses
  }
}