import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Menambahkan ini untuk mengizinkan permintaan dari origin lain
  app.enableCors();

  await app.listen(3000);
}
bootstrap();