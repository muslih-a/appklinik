import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 1. Impor useAuth
import apiClient from '../api/apiClient'; // Pastikan apiClient diimpor

// Interface untuk data dari token
interface DecodedToken {
  id: string;
  role: string;
}

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // 2. Ambil fungsi login dari context

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      // Panggilan API tetap sama, tapi sekarang menggunakan apiClient
      const response = await apiClient.post('/auth/login', { email, password });

      const token = response.data.token;
      
      // 3. Panggil fungsi login dari context dengan token
      login(token);

      // 4. Arahkan pengguna berdasarkan role
      // Kita perlu decode di sini sekali untuk pengalihan halaman
      const { jwtDecode } = await import('jwt-decode');
      const decodedToken: DecodedToken = jwtDecode(token);

      if (decodedToken.role === 'Admin') {
        navigate('/');
      } else if (decodedToken.role === 'Doctor') {
        navigate('/doctor/dashboard');
      } else {
        // Asumsi role lain tidak seharusnya bisa login ke platform ini
        setError('Anda tidak memiliki hak akses untuk platform ini.');
        // Fungsi logout dari context akan membersihkan sisa data
        const { logout } = useAuth();
        logout();
      }

    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login gagal. Silakan coba lagi.');
    }
  };

  return (
    <div>
      <h2>Login Page</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;