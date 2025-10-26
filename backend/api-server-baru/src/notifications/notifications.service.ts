import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly expoPushEndpoint = 'https://exp.host/--/api/v2/push/send';

  // Method untuk mengirim notifikasi panggilan pasien
  async sendPatientCallNotification(
    expoPushToken: string,
    clinicName: string, // Bisa tambahkan parameter lain jika perlu
    queueNumber?: number, // Nomor antrian opsional
  ): Promise<void> {
    // Pastikan token valid sebelum mengirim
    if (!this.isValidExpoPushToken(expoPushToken)) {
      this.logger.warn(
        `Invalid Expo Push Token format: ${expoPushToken}. Skipping notification.`,
      );
      return;
    }

    const message = {
      to: expoPushToken,
      sound: 'default', // Suara notifikasi default
      title: 'Panggilan dari Klinik',
      body: `Giliran Anda di ${clinicName} telah tiba${queueNumber ? ` (Antrian ${queueNumber})` : ''}. Mohon segera menuju ruang pemeriksaan.`,
      data: { type: 'patient-call', clinicName: clinicName, queueNumber: queueNumber }, // Data tambahan jika perlu dihandle di app
    };

  try {
    this.logger.log(`Mengirim notifikasi panggilan ke token: ${expoPushToken}`);
    const response = await axios.post(this.expoPushEndpoint, message, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    // --- [PERBAIKAN LOGIKA CEK RESPONSE] ---
    // Struktur response Expo V2: { data: { status: 'ok', id: '...' } } atau { data: { status: 'error', message: '...', details: {...} } }
    const responseData = response.data?.data; // Ambil bagian 'data' dari response

    if (responseData && responseData.status === 'ok') {
      this.logger.log(
        `Notifikasi berhasil dikirim (ID: ${responseData.id}) ke token: ${expoPushToken}`
      );
    } else if (responseData && responseData.status === 'error') {
      // Jika Expo mengembalikan error yang terstruktur
      this.logger.error(
        `Expo melaporkan error saat mengirim ke token ${expoPushToken}: ${responseData.message} | Details: ${JSON.stringify(responseData.details)}`
      );
      // Anda bisa menambahkan penanganan khusus di sini, misal jika error = DeviceNotRegistered
      if (responseData.details?.error === 'DeviceNotRegistered') {
        // TODO: Tambahkan logika untuk menghapus/menandai token ini di database Anda
        this.logger.warn(`Token ${expoPushToken} tidak lagi terdaftar. Pertimbangkan untuk menghapusnya.`);
      }
    } else {
      // Jika format response tidak terduga
      this.logger.warn(
        `Gagal mengirim notifikasi ke token ${expoPushToken} atau format response tidak dikenal. Response: ${JSON.stringify(response.data)}`
      );
    }
    // ------------------------------------------

  } catch (error) {
    // Penanganan error Axios (tidak berubah)
    if (axios.isAxiosError(error) && error.response) {
      this.logger.error(
        `Error API saat mengirim notifikasi Expo ke token ${expoPushToken}:`,
        error.response.data || error.message,
      );
    } else if (error instanceof Error) {
      this.logger.error(
        `Error JS saat mengirim notifikasi Expo ke token ${expoPushToken}:`,
        error.message,
      );
    } else {
       this.logger.error(
        `Error tidak dikenal saat mengirim notifikasi Expo ke token ${expoPushToken}:`, error);
    }
  }
}

  // Fungsi sederhana untuk validasi format token (bisa disesuaikan)
  private isValidExpoPushToken(token: string): boolean {
    return typeof token === 'string' && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) && token.endsWith(']');
  }

  // Anda bisa menambahkan method lain di sini untuk jenis notifikasi berbeda
  // async sendAppointmentReminder(...) {}
}