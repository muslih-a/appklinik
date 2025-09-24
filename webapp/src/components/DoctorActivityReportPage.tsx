import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

// Tipe data untuk riwayat janji temu
interface AppointmentHistory {
  _id: string;
  appointmentTime: string;
  patient: { name: string };
}

// Fungsi untuk mendapatkan tanggal awal dan akhir bulan ini
const getMonthDateRange = () => {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
  return { firstDay, lastDay };
};

const DoctorActivityReportPage = () => {
  const [reportData, setReportData] = useState<AppointmentHistory[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0); // State baru untuk total
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State untuk filter tanggal, default-nya bulan ini
  const [startDate, setStartDate] = useState(getMonthDateRange().firstDay);
  const [endDate, setEndDate] = useState(getMonthDateRange().lastDay);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Panggil endpoint history DENGAN parameter status=COMPLETED
      const response = await apiClient.get('/appointments/history', {
        params: { 
          startDate, 
          endDate,
          status: 'COMPLETED' // Ini perbedaannya
        },
      });
      
      setReportData(response.data.data);
      setTotalCompleted(response.data.count); // Simpan jumlah total dari response
    } catch (err) {
      setError('Gagal memuat laporan aktivitas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <p>Memuat laporan...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/doctor/dashboard">{'< Kembali ke Dashboard'}</Link>
      </nav>
      
      <h2>Laporan Aktivitas (Konsultasi Selesai)</h2>

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

      {/* --- Rangkuman Total --- */}
      <div style={{ border: '1px solid green', padding: '15px', marginBottom: '20px', backgroundColor: '#e8f5e9' }}>
        <h3 style={{ margin: 0 }}>Total Konsultasi Selesai: {totalCompleted}</h3>
      </div>

      {reportData.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid black' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Tanggal</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Nama Pasien</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((appt) => (
              <tr key={appt._id} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '8px' }}>{new Date(appt.appointmentTime).toLocaleDateString('id-ID')}</td>
                <td style={{ padding: '8px' }}>{appt.patient.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Tidak ada konsultasi yang selesai untuk periode yang dipilih.</p>
      )}
    </div>
  );
};

export default DoctorActivityReportPage;