import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Periksa apakah ada token di localStorage
  const token = localStorage.getItem('authToken');

  // Jika ada token, izinkan akses ke halaman yang diminta (menggunakan <Outlet />)
  // Jika tidak ada token, "tendang" pengguna kembali ke halaman login
  return token ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;