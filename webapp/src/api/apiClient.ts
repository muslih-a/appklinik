import axios from 'axios';

// Membuat instance axios yang sudah dikonfigurasi
const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // Alamat dasar backend kita
});

// Ini bagian "ajaib"-nya: Interceptor
// Fungsi ini akan berjalan SECARA OTOMATIS setiap kali kita akan mengirim permintaan
apiClient.interceptors.request.use(
  (config) => {
    // Ambil token dari localStorage
    const token = localStorage.getItem('authToken');
    
    // Jika token ada, tambahkan ke header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config; // Lanjutkan pengiriman permintaan dengan header baru
  },
  (error) => {
    // Jika ada error saat persiapan permintaan, tolak promise-nya
    return Promise.reject(error);
  }
);

export default apiClient;