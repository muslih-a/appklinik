import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    // Ambil dulu secret key-nya
    const secret = configService.get<string>('JWT_SECRET');

    // Lakukan pemeriksaan: jika secret tidak ada, hentikan aplikasi dengan eror
    if (!secret) {
      throw new Error('JWT_SECRET is not set in the .env file. Please add it!');
    }

    // Jika secret ada, baru jalankan super()
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // Gunakan variabel secret yang sudah kita periksa
    });
  }

  async validate(payload: any) {
    return payload;
  }
}