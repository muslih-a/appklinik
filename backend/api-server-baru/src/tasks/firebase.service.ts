import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class FirebaseService {
  // Kita tidak lagi memerlukan OnModuleInit dan inisialisasi firebase-admin

  async sendPushNotification(token: string, title: string, body: string) {
    if (!token) {
      console.error('Expo push token is missing. Cannot send notification.');
      return;
    }

    // Validasi untuk memastikan ini adalah token Expo
    if (!token.startsWith('ExponentPushToken')) {
        console.error(`Push token ${token} is not a valid ExponentPushToken.`);
        return;
    }

    const message = {
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: { withSome: 'data' },
    };

    try {
      // Kirim notifikasi ke API milik Expo
      await axios.post('https://exp.host/--/api/v2/push/send', message, {
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });
      console.log(`Successfully sent notification to ${token}`);
    } catch (error) {
      // Menampilkan pesan error yang lebih jelas dari server Expo
      console.error('Error sending push notification:', error.response?.data || error.message);
    }
  }
}