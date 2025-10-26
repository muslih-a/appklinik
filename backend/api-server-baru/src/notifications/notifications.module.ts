import { Module, Global } from '@nestjs/common';
import { NotificationService } from './notifications.service';

@Global() // Membuat service bisa di-inject di module lain tanpa import eksplisit
@Module({
  providers: [NotificationService],
  exports: [NotificationService], // Export service agar bisa digunakan module lain
})
export class NotificationsModule {}