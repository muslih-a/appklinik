import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

// Tipe data untuk riwayat janji temu
interface AppointmentHistory {
  _id: string;
  appointmentTime: string;
  status: string;
  patient: { name: string };
}

// Fungsi untuk mendapatkan tanggal awal dan akhir bulan ini
const getMonthDateRange = () => {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
  return { firstDay, lastDay };
};

const DoctorAllHistoryPage = () => {
  const [history, setHistory] = useState<AppointmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State untuk filter tanggal, default-nya bulan ini
  const [startDate, setStartDate] = useState(getMonthDateRange().firstDay);
  const [endDate, setEndDate] = useState(getMonthDateRange().lastDay);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Panggil endpoint history tanpa parameter status
      const response = await apiClient.get('/appointments/history', {
        params: { startDate, endDate },
      });
      
      setHistory(response.data.data);
    } catch (err) {
      setError('Gagal memuat riwayat konsultasi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <p>Memuat riwayat...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/doctor/dashboard">{'< Kembali ke Dashboard'}</Link>
      </nav>
      
      <h2>Riwayat Konsultasi (Semua Status)</h2>

      {/* --- Bagian Filter Tanggal --- */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <div>
          <label>Dari Tanggal: </label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label>Sampai Tanggal: </label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {history.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid black' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Tanggal</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Nama Pasien</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((appt) => (
              <tr key={appt._id} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '8px' }}>{new Date(appt.appointmentTime).toLocaleDateString('id-ID')}</td>
                <td style={{ padding: '8px' }}>{appt.patient.name}</td>
                <td style={{ padding: '8px' }}>{appt.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Tidak ada riwayat untuk periode yang dipilih.</p>
      )}
    </div>
  );
};

export default DoctorAllHistoryPage;