import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // 1. Impor jwt-decode

// 2. Buat "blueprint" untuk isi dari token kita
interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      const response = await axios.post(
        'http://localhost:3000/auth/login',
        { email, password },
      );

      const token = response.data.token;
      localStorage.setItem('authToken', token);

      // 3. Baca isi token setelah login berhasil
      const decodedToken = jwtDecode<DecodedToken>(token);

      // 4. Arahkan pengguna berdasarkan role di dalam token
      if (decodedToken.role === 'Admin') {
        navigate('/'); // Arahkan Admin ke dashboard utama
      } else if (decodedToken.role === 'Doctor') {
        navigate('/doctor/dashboard'); // Arahkan Dokter ke dashboard khusus
      } else {
        // Jika ada role lain (misal: Pasien), arahkan ke halaman login lagi
        setError('Role tidak dikenal.');
        localStorage.removeItem('authToken'); // Hapus token jika role tidak valid
      }

    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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