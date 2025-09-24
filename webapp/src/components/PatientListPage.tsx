import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

// Tipe data untuk Pasien
interface Patient {
  _id: string;
  name: string;
  email: string;
}

// Tipe data untuk profil dokter yang login
interface DoctorProfile {
  clinic: {
    _id: string;
  };
}

const PatientListPage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const profileResponse = await apiClient.get('/auth/profile/me');
      const doctorProfile: DoctorProfile = profileResponse.data;
      
      if (doctorProfile.clinic?._id) {
        const clinicId = doctorProfile.clinic._id;
        const patientsResponse = await apiClient.get(`/clinics/${clinicId}/patients`);
        setPatients(patientsResponse.data);
      } else {
        setError('Dokter tidak terhubung dengan klinik manapun.');
      }

    } catch (err) {
      setError('Gagal memuat daftar pasien.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <p>Memuat daftar pasien...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/doctor/dashboard">{'< Kembali ke Dashboard'}</Link>
      </nav>
      
      <h2>Daftar Pasien Klinik</h2>

      {patients.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid black' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Nama</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient._id} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '8px' }}>{patient.name}</td>
                <td style={{ padding: '8px' }}>{patient.email}</td>
                <td style={{ padding: '8px' }}>
                  {/* --- PERUBAHAN DI SINI --- */}
                  <Link to={`/doctor/patients/${patient._id}`}>Lihat Detail</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Belum ada pasien yang terdaftar di klinik ini.</p>
      )}
    </div>
  );
};

export default PatientListPage;