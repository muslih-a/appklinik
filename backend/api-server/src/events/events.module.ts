import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Module({
  providers: [EventsGateway],
  exports: [EventsGateway], // <-- PENTING: Ekspor agar bisa dipakai modul lain
})
export class EventsModule {}