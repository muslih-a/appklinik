import React from 'react';
// Hapus BrowserRouter as Router dari impor ini
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage'; // Asumsi ini dashboard SuperAdmin
import DoctorManagementPage from './components/DoctorManagementPage'; // Asumsi ini untuk SuperAdmin
import DoctorDashboardPage from './components/DoctorDashboardPage'; // Dashboard Dokter/AdminKlinik
import SettingsPage from './components/SettingsPage'; // Pengaturan Dokter/AdminKlinik?
import PatientListPage from './components/PatientListPage'; // Akses Dokter/AdminKlinik
import PatientCardPage from './components/PatientCardPage'; // Akses Dokter/AdminKlinik
import DoctorAllHistoryPage from './components/DoctorAllHistoryPage'; // Akses Dokter/AdminKlinik
import DoctorActivityReportPage from './components/DoctorActivityReportPage'; // Akses Dokter/AdminKlinik
import BillingReportPage from './components/BillingReportPage'; // Asumsi ini untuk SuperAdmin
import NotificationSettingsPage from './pages/NotificationSettingsPage'; // Untuk siapa? Kita anggap Admin
import VaccineManagementPage from './pages/VaccineManagementPage'; // Akses Admin, Dokter, AdminKlinik
import AdminKlinikManagementPage from './pages/AdminKlinikManagementPage'; // Import halaman baru

// Komponen Navigasi Internal (dipisah agar bisa akses useAuth)
function Navigation() {
  const { user, logout } = useAuth();
  // useNavigate tidak perlu di sini jika logout ditangani context
  // const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Panggil fungsi logout dari context
  };

  if (!user) {
    return null; // Jangan tampilkan nav jika belum login
  }

  return (
    <nav style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', padding: '10px', background: '#f0f0f0', marginBottom: '15px' }}>
      <span style={{ fontWeight: 'bold', marginRight: '20px' }}>App Klinik</span>

      {/* Tampilkan link berdasarkan role */}
      {user.role === 'Admin' && (
        <>
          <Link to="/admin/dashboard" style={{ marginRight: '10px' }}>Dashboard Admin</Link>
          <Link to="/admin/manage-doctors" style={{ marginRight: '10px' }}>Manajemen Dokter</Link>
          <Link to="/admin/manage-admin-klinik" style={{ marginRight: '10px' }}>Manajemen Admin Klinik</Link> {/* Link Baru */}
          <Link to="/admin/vaccines" style={{ marginRight: '10px' }}>Manajemen Vaksin</Link>
          <Link to="/admin/billing-report" style={{ marginRight: '10px' }}>Laporan Billing</Link>
          <Link to="/admin/settings/notifications" style={{ marginRight: '10px' }}>Pengaturan Notifikasi</Link>
          {/* Tambahkan link admin lain jika ada */}
        </>
      )}

      {(user.role === 'Doctor' || user.role === 'AdminKlinik') && (
        <>
          <Link to="/clinic/dashboard" style={{ marginRight: '10px' }}>Dashboard Klinik</Link>
          <Link to="/clinic/patients" style={{ marginRight: '10px' }}>Pasien Klinik</Link>
          <Link to="/clinic/history" style={{ marginRight: '10px' }}>Riwayat Klinik</Link>
          <Link to="/clinic/report" style={{ marginRight: '10px' }}>Laporan Klinik</Link>
          <Link to="/clinic/vaccines" style={{ marginRight: '10px' }}>Manajemen Vaksin Klinik</Link>
           {/* Link Settings mungkin perlu path berbeda */}
          <Link to="/clinic/settings" style={{ marginRight: '10px' }}>Pengaturan Klinik</Link>
        </>
      )}

      {/* Tombol Logout selalu ada di kanan */}
      <div style={{ marginLeft: 'auto' }}>
        <span>Halo, {user.name} ({user.role})</span>
        <button onClick={handleLogout} style={{ marginLeft: '15px' }}>Logout</button>
      </div>
    </nav>
  );
}


// Komponen Utama Aplikasi (Perbaikan: Hapus <Router>)
function App() {
  return (
    // AuthProvider langsung membungkus AppContent
    <AuthProvider>
      {/* ---> <Router> DIHAPUS DARI SINI <--- */}
      <AppContent />
      {/* -------------------------------- */}
    </AuthProvider>
  );
}

// Komponen Konten Aplikasi (agar bisa akses context)
function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Memeriksa status login...</div>; // Tampilan loading
  }

  return (
    <div>
      <Navigation /> {/* Tampilkan navigasi di sini */}
      <hr />

      {/* Routes tetap di dalam sini */}
      <Routes>
        {/* Rute Publik */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} /> {/* Arahkan ke home jika sudah login */}

        {/* Rute Terlindungi - Halaman Awal setelah login */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {/* Redirect ke dashboard sesuai role */}
              {user?.role === 'Admin' ? <Navigate to="/admin/dashboard" replace /> :
               user?.role === 'Doctor' ? <Navigate to="/clinic/dashboard" replace /> : // Arahkan ke /clinic/dashboard
               user?.role === 'AdminKlinik' ? <Navigate to="/clinic/dashboard" replace /> : // Arahkan ke /clinic/dashboard juga
               <Navigate to="/login" replace /> // Fallback jika role tidak dikenal
              }
            </ProtectedRoute>
          }
        />

        {/* === Rute Khusus Admin (SuperAdmin) === */}
        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute roles={['Admin']}><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/manage-doctors"
          element={<ProtectedRoute roles={['Admin']}><DoctorManagementPage /></ProtectedRoute>}
        />
         {/* ---> RUTE BARU UNTUK MANAJEMEN ADMIN KLINIK <--- */}
        <Route
          path="/admin/manage-admin-klinik"
          element={
            <ProtectedRoute roles={['Admin']}>
              <AdminKlinikManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/billing-report"
          element={<ProtectedRoute roles={['Admin']}><BillingReportPage /></ProtectedRoute>}
        />
         <Route
          path="/admin/settings/notifications" // Pindahkan ke grup Admin
          element={<ProtectedRoute roles={['Admin']}><NotificationSettingsPage /></ProtectedRoute>}
        />
         <Route
          path="/admin/vaccines" // Beri akses Admin ke manajemen vaksin umum
          element={<ProtectedRoute roles={['Admin']}><VaccineManagementPage /></ProtectedRoute>}
        />
        {/* Tambahkan rute Admin lainnya di sini */}


        {/* === Rute Khusus Dokter & AdminKlinik === */}
        {/* Gunakan prefix /clinic/ agar lebih jelas */}
        <Route
          path="/clinic/dashboard"
          element={<ProtectedRoute roles={['Doctor', 'AdminKlinik']}><DoctorDashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/clinic/patients"
          element={<ProtectedRoute roles={['Doctor', 'AdminKlinik']}><PatientListPage /></ProtectedRoute>}
        />
        <Route
          path="/clinic/patients/:id" // Tambahkan :id parameter
          element={<ProtectedRoute roles={['Doctor', 'AdminKlinik']}><PatientCardPage /></ProtectedRoute>}
        />
         <Route
          path="/clinic/history" // Ganti path agar konsisten
          element={<ProtectedRoute roles={['Doctor', 'AdminKlinik']}><DoctorAllHistoryPage /></ProtectedRoute>}
        />
        <Route
          path="/clinic/report" // Ganti path agar konsisten
          element={<ProtectedRoute roles={['Doctor', 'AdminKlinik']}><DoctorActivityReportPage /></ProtectedRoute>}
        />
        <Route
          path="/clinic/vaccines" // Manajemen vaksin spesifik klinik?
          element={<ProtectedRoute roles={['Doctor', 'AdminKlinik']}><VaccineManagementPage /></ProtectedRoute>}
        />
         <Route
          path="/clinic/settings" // Ganti path agar konsisten
          element={<ProtectedRoute roles={['Doctor', 'AdminKlinik']}><SettingsPage /></ProtectedRoute>}
        />
        {/* Tambahkan rute Dokter/AdminKlinik lainnya di sini */}


        {/* Fallback Route - Harus paling bawah */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </div>
  );
}

export default App;