import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- [TAMBAHKAN BARIS INI] ---
  // Memberi izin agar frontend bisa mengakses API ini
  app.enableCors();
  // --------------------------------

  await app.listen(3000);
}
bootstrap();