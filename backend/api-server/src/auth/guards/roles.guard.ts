import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Mendapatkan role apa yang dibutuhkan dari "stempel" @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Jika tidak ada stempel @Roles, endpoint ini tidak memerlukan role spesifik
    if (!requiredRoles) {
      return true;
    }

    // Mendapatkan data user dari request (yang sudah divalidasi oleh JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Jika karena suatu alasan tidak ada data user, tolak akses
    if (!user) {
      return false;
    }

    // Memeriksa apakah role user ada di dalam daftar role yang diizinkan
    return requiredRoles.some((role) => user.role === role);
  }
}