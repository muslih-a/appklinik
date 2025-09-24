import { Routes, Route, Link, useNavigate } from 'react-router-dom';
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
// --- 1. Impor komponen baru ---
import BillingReportPage from './components/BillingReportPage';


function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <div>
      <h1>Aplikasi Klinik</h1>

      {/* --- 2. Tambahkan link navigasi untuk Admin --- */}
      <nav style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ marginRight: '10px' }}>
          Dashboard
        </Link>
        <Link to="/doctors" style={{ marginRight: '10px' }}>
          Manajemen Dokter
        </Link>
        <Link to="/billing-report" style={{ marginRight: 'auto' }}>
          Laporan Billing
        </Link>
        <button onClick={handleLogout}>Logout</button>
      </nav>
      <hr />

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          {/* Rute untuk Admin */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/doctors" element={<DoctorManagementPage />} />
          {/* --- 3. Tambahkan rute baru untuk Laporan Billing --- */}
          <Route path="/billing-report" element={<BillingReportPage />} />

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