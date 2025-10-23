import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [], // Tidak lagi butuh impor
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}