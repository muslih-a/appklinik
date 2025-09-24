import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

// --- Tipe data diperbarui ---
interface PatientProfile {
  name: string;
  email: string;
  address?: string;
  phoneNumber?: string;
}

// Gabungkan properti EMR langsung ke dalam AppointmentHistory
interface AppointmentHistory {
  _id: string;
  appointmentTime: string;
  status: string;
  doctor: { name: string };
  symptoms?: string;   // Langsung di sini
  diagnosis?: string;  // Langsung di sini
  treatment?: string;  // Langsung di sini
}

interface VaccinationHistory {
  _id: string;
  vaccineName: string;
  dateGiven: string;
}

interface PatientHistory {
  profile: PatientProfile;
  appointments: AppointmentHistory[];
  vaccinations: VaccinationHistory[];
}
// ---

const PatientCardPage = () => {
  const { id } = useParams<{ id: string }>();
  const [history, setHistory] = useState<PatientHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get(`/patients/${id}/history`);
      setHistory(response.data);
    } catch (err) {
      setError('Gagal memuat riwayat pasien.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <p>Memuat riwayat pasien...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/doctor/patients">{'< Kembali ke Daftar Pasien'}</Link>
      </nav>

      {history && (
        <>
          {/* ... Bagian Profil Pasien tidak berubah ... */}
          <div style={{ marginBottom: '25px' }}>
            <h2>Kartu Pasien: {history.profile.name}</h2>
            <p><strong>Email:</strong> {history.profile.email}</p>
            <p><strong>Alamat:</strong> {history.profile.address || 'Belum diisi'}</p>
            <p><strong>No. HP:</strong> {history.profile.phoneNumber || 'Belum diisi'}</p>
          </div>

          {/* --- PERUBAHAN UTAMA DI SINI --- */}
          <div style={{ marginBottom: '25px' }}>
            <h3>Riwayat Kunjungan</h3>
            {history.appointments.length > 0 ? (
              history.appointments.map((appt) => (
                <div key={appt._id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                  <p><strong>Tanggal:</strong> {new Date(appt.appointmentTime).toLocaleDateString('id-ID')}</p>
                  <p><strong>Dokter:</strong> {appt.doctor.name}</p>
                  <p><strong>Status:</strong> {appt.status}</p>
                  {/* Cek salah satu field EMR, misalnya 'diagnosis', untuk menampilkannya */}
                  {appt.diagnosis && (
                    <div style={{ marginTop: '10px', backgroundColor: '#f9f9f9', padding: '10px' }}>
                      <strong>Rekam Medis:</strong>
                      {/* Baca langsung dari properti 'appt', bukan 'appt.emr' */}
                      <p style={{ margin: '5px 0 0' }}>- Gejala: {appt.symptoms}</p>
                      <p style={{ margin: '5px 0 0' }}>- Diagnosis: {appt.diagnosis}</p>
                      <p style={{ margin: '5px 0 0' }}>- Pengobatan: {appt.treatment}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>Tidak ada riwayat kunjungan.</p>
            )}
          </div>
          
          {/* ... Bagian Riwayat Vaksinasi tidak berubah ... */}
          <div>
            <h3>Riwayat Vaksinasi</h3>
            {history.vaccinations.length > 0 ? (
               history.vaccinations.map((vax) => (
                <div key={vax._id} style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '5px' }}>
                   <p><strong>{vax.vaccineName}</strong> - Diberikan pada: {new Date(vax.dateGiven).toLocaleDateString('id-ID')}</p>
                </div>
               ))
            ) : (
              <p>Tidak ada riwayat vaksinasi.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PatientCardPage;