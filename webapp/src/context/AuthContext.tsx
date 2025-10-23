import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react'; // Cara impor yang benar untuk tipe
import { jwtDecode } from 'jwt-decode'; // Pastikan Anda sudah install: npm install jwt-decode
import apiClient from '../api/apiClient'; // Impor apiClient Anda

// 1. Definisikan seperti apa data user kita
interface User {
  id: string;
  name: string;
  role: string;
  clinicId?: string;
}

// 2. Definisikan apa saja yang akan disediakan oleh Context
interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

// 3. Buat Context itu sendiri
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Buat "Pembungkus" (Provider) yang akan mengelola state
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Saat aplikasi pertama kali dimuat, coba ambil token dari penyimpanan
    const bootstrapAsync = async () => {
      let userToken: string | null = null;
      try {
        userToken = localStorage.getItem('authToken');
        if (userToken) {
          const decoded: User = jwtDecode(userToken);
          setUser(decoded);
          // Set token ke header apiClient untuk request selanjutnya
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        }
      } catch (e) {
        // Token tidak valid atau error
        console.error('Gagal memuat token:', e);
      }
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const login = (token: string) => {
    const decoded: User = jwtDecode(token);
    setUser(decoded);
    localStorage.setItem('authToken', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    delete apiClient.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 5. Buat "Hook" untuk mempermudah komponen lain mengakses context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
};