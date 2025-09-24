import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, clinicId: string) {
    client.join(clinicId);
    console.log(`Client ${client.id} joined room: ${clinicId}`);
    client.emit('joinedRoom', `Successfully joined room ${clinicId}`);
  }

  sendQueueUpdate(clinicId: string, data: { activeQueue: any[], dailyHistory: any[] }) {
    this.server.to(clinicId).emit('queueUpdated', data);
    console.log(`Sent queue update to room: ${clinicId}`);
  }

  sendPatientSkippedNotification(clinicId: string, patientName: string) {
    this.server.to(clinicId).emit('patientSkipped', { patientName });
    console.log(`Sent patient skipped notification for ${patientName} to room: ${clinicId}`);
  }

  // --- FUNGSI BARU DITAMBAHKAN DI SINI ---
  // Fungsi ini untuk mengirim notifikasi real-time saat dokter menekan tombol "Panggil"
  sendPatientCalledNotification(clinicId: string, patientId: string, queueNumber: number) {
    this.server.to(clinicId).emit('patientCalled', { patientId, queueNumber });
    console.log(`Sent "patient called" notification for patient ${patientId} to room: ${clinicId}`);
  }
}