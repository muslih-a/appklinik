import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  // [PERBAIKAN] Mengganti tipe 'any' menjadi 'ExecutionContext'
  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const authorization = client.handshake?.headers?.authorization;

    if (!authorization) {
      console.error('WS Guard: No authorization header');
      client.disconnect();
      return false;
    }

    const token = authorization.split(' ')[1];
    if (!token) {
      console.error('WS Guard: No token found');
      client.disconnect();
      return false;
    }

    try {
      const payload = this.jwtService.verify(token);
      client['user'] = payload; // Menempelkan data user ke object socket
      return true;
    } catch (e) {
      console.error('WS Guard: Invalid token', e.message);
      client.disconnect();
      return false;
    }
  }
}