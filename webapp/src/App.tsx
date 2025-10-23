import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; 
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import DoctorManagementPage from './components/DoctorManagementPage';
import DoctorDashboardPage from './components/DoctorDashboardPage';
import SettingsPage from './components/SettingsPage';
import PatientListPage from './components/PatientListPage';
import PatientCardPage from './components/PatientCardPage';
import DoctorAllHistoryPage from './components/DoctorAllHistoryPage';
import DoctorActivityReportPage from './components/DoctorActivityReportPage';
import BillingReportPage from './components/BillingReportPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import VaccineManagementPage from './pages/VaccineManagementPage';

function App() {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth(); 

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Menampilkan loading saat context sedang memeriksa status login
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Aplikasi Klinik</h1>

      {user && (
        <nav style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Link Dashboard disesuaikan */}
          <Link to="/dashboard" style={{ marginRight: '10px' }}>
            Dashboard
          </Link>
          <Link to="/doctors" style={{ marginRight: '10px' }}>
            Manajemen Dokter
          </Link>
          <Link to="/vaccines" style={{ marginRight: '10px' }}>
            Manajemen Vaksin
          </Link>
          <Link to="/billing-report" style={{ marginRight: '10px' }}>
            Laporan Billing
          </Link>
          <Link to="/settings/notifications" style={{ marginRight: 'auto' }}>
            Pengaturan Notifikasi
          </Link>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      )}
      <hr />

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          {/* Rute default setelah login */}
          <Route 
            path="/" 
            element={
              user?.role === 'Admin' ? <Navigate to="/dashboard" /> : <Navigate to="/doctor/dashboard" />
            } 
          />
          
          {/* Rute untuk Admin */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/doctors" element={<DoctorManagementPage />} />
          <Route path="/billing-report" element={<BillingReportPage />} />
          <Route
            path="/settings/notifications"
            element={<NotificationSettingsPage />}
          />
          <Route
            path="/vaccines"
            element={<VaccineManagementPage />}
          />

          {/* Rute untuk Dokter */}
          <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/doctor/patients" element={<PatientListPage />} />
          <Route path="/doctor/patients/:id" element={<PatientCardPage />} />
          <Route path="/doctor/history" element={<DoctorAllHistoryPage />} />
          <Route path="/doctor/report" element={<DoctorActivityReportPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;