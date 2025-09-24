import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import AddClinicForm from './AddClinicForm';

// Interface untuk data Klinik
interface Clinic {
  _id: string;
  name: string;
  address: string;
  phoneNumber?: string;
}

// --- 1. Interface baru untuk data statistik ---
interface AdminStats {
  totalClinics: number;
  totalDoctors: number;
  totalPatients: number;
  totalCompletedAppointments: number;
}

const DashboardPage = () => {
  // State untuk manajemen klinik (tidak berubah)
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  
  // --- 2. State baru untuk statistik ---
  const [stats, setStats] = useState<AdminStats | null>(null);

  const fetchClinics = useCallback(async () => {
    // ... (fungsi fetchClinics tidak berubah)
    setLoading(true);
    try {
      const response = await apiClient.get('/clinics');
      setClinics(response.data);
    } catch (err) {
      setError('Gagal mengambil data klinik.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- 3. Logika baru untuk mengambil data statistik ---
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/dashboard/admin-stats');
        setStats(response.data);
      } catch (err) {
        console.error("Gagal mengambil data statistik:", err);
        // Biarkan error utama ditangani oleh fetchClinics
      }
    };

    fetchStats();
    fetchClinics();
  }, [fetchClinics]);

  const handleClinicAdded = () => {
    fetchClinics();
    setIsFormVisible(false);
    setEditingClinic(null);
  };
  
  // ... (fungsi handleDelete dan handleEditClick tidak berubah)

  const handleDelete = async (clinicId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus klinik ini?')) {
      try {
        await apiClient.delete(`/clinics/${clinicId}`);
        alert('Klinik berhasil dihapus.');
        fetchClinics();
      } catch (err) {
        alert('Gagal menghapus klinik.');
        console.error(err);
      }
    }
  };

  const handleEditClick = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setIsFormVisible(true);
  };

  const handleToggleForm = () => {
    setIsFormVisible(!isFormVisible);
    if (isFormVisible) {
      setEditingClinic(null);
    }
  };


  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>Selamat datang! Anda berhasil login.</p>
      
      {/* --- 4. Tampilan baru untuk kartu statistik --- */}
      <hr />
      <h3>Statistik Platform</h3>
      {stats ? (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div style={statCardStyle}><h4>Total Klinik</h4><p style={statNumberStyle}>{stats.totalClinics}</p></div>
          <div style={statCardStyle}><h4>Total Dokter</h4><p style={statNumberStyle}>{stats.totalDoctors}</p></div>
          <div style={statCardStyle}><h4>Total Pasien</h4><p style={statNumberStyle}>{stats.totalPatients}</p></div>
          <div style={statCardStyle}><h4>Konsultasi Selesai</h4><p style={statNumberStyle}>{stats.totalCompletedAppointments}</p></div>
        </div>
      ) : (
        <p>Memuat statistik...</p>
      )}

      <hr />
      {/* --- Bagian Manajemen Klinik tidak berubah --- */}
      <h3>Manajemen Klinik</h3>
      
      {loading ? (
        <p>Memuat data...</p>
      ) : clinics.length > 0 ? (
        <ul>
          {clinics.map((clinic) => (
            <li key={clinic._id}>
              {clinic.name} - {clinic.address}
              <button onClick={() => handleEditClick(clinic)} style={{ marginLeft: '10px' }}>Edit</button>
              <button onClick={() => handleDelete(clinic._id)} style={{ marginLeft: '5px' }}>Hapus</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Belum ada data klinik.</p>
      )}

      <hr />

      {isFormVisible && (
        <AddClinicForm 
          onClinicAdded={handleClinicAdded} 
          clinicToEdit={editingClinic} 
        />
      )}

      <button onClick={handleToggleForm} style={{ marginTop: '10px' }}>
        {isFormVisible ? 'Batal' : 'Tambah Klinik Baru'}
      </button>
    </div>
  );
};

// --- Style untuk kartu statistik ---
const statCardStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '10px 20px',
  textAlign: 'center',
  flex: 1,
};
const statNumberStyle: React.CSSProperties = {
  fontSize: '2em',
  fontWeight: 'bold',
  margin: 0,
};

export default DashboardPage;