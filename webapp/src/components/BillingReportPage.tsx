import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

// Tipe data
interface Clinic {
  _id: string;
  name: string;
}

interface ReportItem {
  _id: string;
  appointmentTime: string;
  patient: { name: string };
  doctor: { name: string };
}

// Fungsi untuk mendapatkan tanggal awal dan akhir bulan ini
const getMonthDateRange = () => {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
  return { firstDay, lastDay };
};

const BillingReportPage = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [reportData, setReportData] = useState<ReportItem[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State untuk filter
  const [selectedClinic, setSelectedClinic] = useState('');
  const [startDate, setStartDate] = useState(getMonthDateRange().firstDay);
  const [endDate, setEndDate] = useState(getMonthDateRange().lastDay);

  // 1. Ambil daftar klinik untuk dropdown saat halaman pertama kali dibuka
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await apiClient.get('/clinics');
        setClinics(response.data);
      } catch (err) {
        console.error('Gagal memuat daftar klinik', err);
        setError('Gagal memuat daftar klinik untuk filter.');
      }
    };
    fetchClinics();
  }, []);

  // 2. Ambil data laporan setiap kali filter berubah
  const fetchReport = useCallback(async () => {
    if (!selectedClinic) {
      setReportData([]);
      setTotalCompleted(0);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/reports/billing', {
        params: { clinicId: selectedClinic, startDate, endDate },
      });
      setReportData(response.data.data);
      setTotalCompleted(response.data.count);
    } catch (err) {
      setError('Gagal memuat data laporan.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedClinic, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/">{'< Kembali ke Dashboard'}</Link>
      </nav>

      <h2>Laporan Billing</h2>

      {/* --- Bagian Filter --- */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center' }}>
        <div>
          <label>Pilih Klinik: </label>
          <select value={selectedClinic} onChange={(e) => setSelectedClinic(e.target.value)}>
            <option value="">-- Semua Klinik --</option>
            {clinics.map(clinic => (
              <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Dari: </label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label>Sampai: </label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {loading && <p>Memuat laporan...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && selectedClinic && (
        <>
          {/* --- Rangkuman Total --- */}
          <div style={{ border: '1px solid blue', padding: '15px', marginBottom: '20px', backgroundColor: '#e3f2fd' }}>
            <h3 style={{ margin: 0 }}>Total Konsultasi Selesai: {totalCompleted}</h3>
          </div>

          {/* --- Tabel Laporan --- */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid black' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Tanggal</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Nama Pasien</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Dokter</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item) => (
                <tr key={item._id} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '8px' }}>{new Date(item.appointmentTime).toLocaleDateString('id-ID')}</td>
                  <td style={{ padding: '8px' }}>{item.patient.name}</td>
                  <td style={{ padding: '8px' }}>{item.doctor.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default BillingReportPage;