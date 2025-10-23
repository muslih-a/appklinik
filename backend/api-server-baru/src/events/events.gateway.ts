import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
// 1. Impor decorator OnEvent
import { OnEvent } from '@nestjs/event-emitter';

// Tipe data untuk payload event internal
interface QueueUpdateEventPayload {
  clinicId: string;
  payload: {
    activeQueue: any[];
    onHoldQueue: any[];
    dailyHistory: any[];
  };
}

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // 2. Constructor tidak lagi membutuhkan ClinicsService
  constructor() {}

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

  // 3. Method @SubscribeMessage dihapus karena tidak lagi menerima perintah langsung

  // --- [LISTENER BARU DITAMBAHKAN DI SINI] ---
  /**
   * Mendengarkan event 'queue.updated' dari service mana pun di dalam aplikasi
   */
  @OnEvent('queue.updated')
  handleQueueUpdateEvent(eventPayload: QueueUpdateEventPayload) {
    console.log('Event "queue.updated" diterima, menyiarkan ke frontend...');
    // Panggil method yang ada untuk menyiarkan update ke room yang tepat
    this.sendQueueUpdate(eventPayload.clinicId, eventPayload.payload);
  }
  // ----------------------------------------------------------------

  sendQueueUpdate(clinicId: string, data: { activeQueue: any[], onHoldQueue: any[], dailyHistory: any[] }) {
    this.server.to(clinicId).emit('queueUpdated', data);
    console.log(`Sent queue update to room: ${clinicId}`);
  }

  // ... sisa method send... tidak berubah ...
  sendPatientSkippedNotification(clinicId: string, patientName: string) {
    this.server.to(clinicId).emit('patientSkipped', { patientName });
    console.log(`Sent patient skipped notification for ${patientName} to room: ${clinicId}`);
  }

  sendPatientCalledNotification(clinicId: string, patientId: string, queueNumber: number) {
    this.server.to(clinicId).emit('patientCalled', { patientId, queueNumber });
    console.log(`Sent "patient called" notification for patient ${patientId} to room: ${clinicId}`);
  }
}