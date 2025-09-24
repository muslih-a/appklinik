import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  address?: string;
  phoneNumber?: string;
  clinic: ClinicProfile | null;
}

// --- 1. Perbarui Interface ---
interface ClinicProfile {
  _id: string;
  name: string;
  address: string;
  operatingHours?: string;
  averageConsultationTime?: number;
}

const SettingsPage = () => {
  const [doctorProfile, setDoctorProfile] = useState<UserProfile | null>(null);
  const [clinicProfile, setClinicProfile] = useState<ClinicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isDoctorEditMode, setIsDoctorEditMode] = useState(false);
  const [editableDoctorProfile, setEditableDoctorProfile] = useState({ name: '', address: '', phoneNumber: '' });
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);

  // --- 2. Perbarui State untuk Form Edit Klinik ---
  const [isClinicEditMode, setIsClinicEditMode] = useState(false);
  const [editableClinicProfile, setEditableClinicProfile] = useState({ 
    name: '', 
    address: '', 
    operatingHours: '',
    averageConsultationTime: 15 // Default
  });
  const [isSavingClinic, setIsSavingClinic] = useState(false);

  // ... (fetchData dan fungsi-fungsi dokter tidak berubah) ...
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const userResponse = await apiClient.get('/auth/profile/me');
      const user: UserProfile = userResponse.data;
      setDoctorProfile(user);
      if (user.clinic) {
        setClinicProfile(user.clinic);
      }
    } catch (err) {
      setError('Gagal memuat data pengaturan.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveDoctorProfile = async () => {
    setIsSavingDoctor(true);
    try {
      const response = await apiClient.patch('/auth/profile/me', editableDoctorProfile);
      setDoctorProfile(response.data);
      setIsDoctorEditMode(false);
      alert('Profil dokter berhasil diperbarui.');
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui profil dokter.');
    } finally {
      setIsSavingDoctor(false);
    }
  };
  
  const handleCancelDoctorEdit = () => {
    if(!doctorProfile) return;
    setEditableDoctorProfile({
        name: doctorProfile.name,
        address: doctorProfile.address || '',
        phoneNumber: doctorProfile.phoneNumber || ''
    });
    setIsDoctorEditMode(false);
  }

  const handleSaveClinicProfile = async () => {
    if (!clinicProfile) return;
    setIsSavingClinic(true);
    try {
      // Pastikan data yang dikirim adalah angka
      const payload = {
        ...editableClinicProfile,
        averageConsultationTime: Number(editableClinicProfile.averageConsultationTime)
      };
      const response = await apiClient.patch(`/clinics/${clinicProfile._id}`, payload);
      setClinicProfile(response.data);
      setIsClinicEditMode(false);
      alert('Profil klinik berhasil diperbarui.');
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui profil klinik.');
    } finally {
      setIsSavingClinic(false);
    }
  };

  if (loading) {
    return <p>Memuat data pengaturan...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/doctor/dashboard">{'< Kembali ke Dashboard'}</Link>
      </nav>
      <h2>Pengaturan Akun</h2>

      {/* --- Bagian Profil Dokter (Tidak Diubah) --- */}
      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>Profil Dokter</h3>
        {doctorProfile && (
          isDoctorEditMode ? (
            <div>
              <label>Nama:</label>
              <input 
                type="text" 
                value={editableDoctorProfile.name}
                onChange={(e) => setEditableDoctorProfile({...editableDoctorProfile, name: e.target.value})}
                style={{ width: '98%', padding: '5px', marginBottom: '10px' }}
              />
              <button onClick={handleSaveDoctorProfile} disabled={isSavingDoctor}>
                {isSavingDoctor ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button onClick={handleCancelDoctorEdit} style={{ marginLeft: '5px' }}>
                Batal
              </button>
            </div>
          ) : (
            <div>
              <p><strong>Nama:</strong> {doctorProfile.name}</p>
              <p><strong>Email:</strong> {doctorProfile.email}</p>
              <button onClick={() => {
                setEditableDoctorProfile({
                  name: doctorProfile.name,
                  address: doctorProfile.address || '',
                  phoneNumber: doctorProfile.phoneNumber || ''
                });
                setIsDoctorEditMode(true);
              }}>
                Ubah Profil Dokter
              </button>
            </div>
          )
        )}
      </div>

      {/* --- Bagian Profil Klinik (Diperbarui) --- */}
      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h3>Profil Klinik</h3>
        {clinicProfile && (
          isClinicEditMode ? (
            <div>
              <label>Nama Klinik:</label>
              <input 
                type="text" 
                value={editableClinicProfile.name}
                onChange={(e) => setEditableClinicProfile({...editableClinicProfile, name: e.target.value})}
                style={{ width: '98%', padding: '5px', marginBottom: '10px' }}
              />
              <label>Alamat Klinik:</label>
              <textarea 
                value={editableClinicProfile.address}
                onChange={(e) => setEditableClinicProfile({...editableClinicProfile, address: e.target.value})}
                style={{ width: '98%', padding: '5px', marginBottom: '10px', height: '60px' }}
              />
              <label>Jam Operasional:</label>
              <input 
                type="text" 
                value={editableClinicProfile.operatingHours}
                onChange={(e) => setEditableClinicProfile({...editableClinicProfile, operatingHours: e.target.value})}
                style={{ width: '98%', padding: '5px', marginBottom: '10px' }}
              />
              {/* --- 3. Input baru untuk rata-rata waktu --- */}
              <label>Rata-rata Waktu Konsultasi (menit):</label>
              <input 
                type="number" 
                value={editableClinicProfile.averageConsultationTime}
                onChange={(e) => setEditableClinicProfile({...editableClinicProfile, averageConsultationTime: parseInt(e.target.value, 10) || 0})}
                style={{ width: '98%', padding: '5px', marginBottom: '10px' }}
              />
              <button onClick={handleSaveClinicProfile} disabled={isSavingClinic}>
                {isSavingClinic ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button onClick={() => setIsClinicEditMode(false)} style={{ marginLeft: '5px' }}>
                Batal
              </button>
            </div>
          ) : (
            <div>
              <p><strong>Nama Klinik:</strong> {clinicProfile.name}</p>
              <p><strong>Alamat Klinik:</strong> {clinicProfile.address}</p>
              <p><strong>Jam Operasional:</strong> {clinicProfile.operatingHours || 'Belum diatur'}</p>
              {/* --- 4. Tampilan baru untuk rata-rata waktu --- */}
              <p><strong>Rata-rata Waktu Konsultasi:</strong> {clinicProfile.averageConsultationTime} menit</p>
              <button onClick={() => {
                // --- 5. Siapkan data untuk form edit ---
                setEditableClinicProfile({
                  name: clinicProfile.name,
                  address: clinicProfile.address,
                  operatingHours: clinicProfile.operatingHours || '',
                  averageConsultationTime: clinicProfile.averageConsultationTime || 15
                });
                setIsClinicEditMode(true);
              }}>
                Ubah Profil Klinik
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SettingsPage;