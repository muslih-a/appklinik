import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- [TAMBAHKAN BAGIAN INI] ---
  server: {
    proxy: {
      // Setiap permintaan yang dimulai dengan /auth, /clinics, /vaccines, dll.
      // akan diteruskan ke server backend di localhost:3000
      '/auth': 'http://localhost:3000',
      '/clinics': 'http://localhost:3000',
      '/vaccines': 'http://localhost:3000',
      '/appointments': 'http://localhost:3000',
    }
  }
})