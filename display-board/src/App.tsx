import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';

// Tipe data untuk payload dari WebSocket
interface QueueUpdatePayload {
  nowServing: number;
  // Sesuaikan tipe data 'activeQueue' jika berbeda dari backend
  activeQueue: Array<{ queueNumber: number }>;
}

function App() {
  const [nowServing, setNowServing] = useState<number>(0);
  const [nextInQueue, setNextInQueue] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // --- [PENTING] GANTI DENGAN DISPLAY KEY ANDA ---
  // Anda bisa mendapatkan kunci ini dari database MongoDB di koleksi 'clinics'
  const DISPLAY_KEY = 'fd3ad9ad-8618-47d8-926a-f9ad362eb20a';
  // ------------------------------------------------

  const API_URL = 'http://localhost:3000';

  useEffect(() => {
    // 1. Fungsi untuk mengambil data awal saat komponen dimuat
    const fetchInitialData = async () => {
      try {
        const response = await axios.get(`${API_URL}/clinics/public/queue`, {
          params: { key: DISPLAY_KEY },
        });
        setNowServing(response.data.nowServing);
        setNextInQueue(response.data.nextInQueue);
        setError(null);
      } catch (err) {
        console.error('Gagal mengambil data antrean:', err);
        setError('Tidak dapat terhubung ke server atau Display Key salah.');
      }
    };

    fetchInitialData();

    // 2. Menghubungkan ke WebSocket untuk update real-time
    const socket = io(API_URL);

    socket.on('connect', () => {
      console.log('Terhubung ke server WebSocket!');
    });

    // Mendengarkan event 'queueUpdated' dari server
    socket.on('queueUpdated', (data: QueueUpdatePayload) => {
      console.log('Menerima update antrean:', data);
      setNowServing(data.nowServing);
      // Mengambil 3 antrean berikutnya dari daftar antrean aktif
      const nextThree = data.activeQueue.slice(0, 3).map(p => p.queueNumber);
      setNextInQueue(nextThree);
    });
    
    socket.on('disconnect', () => {
      console.log('Koneksi WebSocket terputus.');
    });

    // 3. Membersihkan koneksi saat komponen di-unmount
    return () => {
      socket.disconnect();
    };
  }, [DISPLAY_KEY]); // Dependency array, efek akan berjalan lagi jika key berubah

  return (
    <div className="display-board">
      {error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="card now-serving">
            <h2>NOMOR ANTRIAN SAAT INI</h2>
            <div className="queue-number-main">{nowServing > 0 ? nowServing : '-'}</div>
          </div>
          <div className="card next-in-queue">
            <h2>ANTRIAN BERIKUTNYA</h2>
            <div className="queue-number-next">
              {nextInQueue.length > 0 ? nextInQueue.join(' - ') : '-'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;