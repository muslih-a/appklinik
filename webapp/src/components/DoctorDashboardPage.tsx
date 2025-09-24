import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import EmrForm from './EmrForm';
import ScheduleVaccinationForm from './ScheduleVaccinationForm';
import { io, Socket } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { Link } from 'react-router-dom';
import DoctorCalendarView from './DoctorCalendarView';

// (Interface tidak berubah)
interface Patient { _id: string; name: string; }
interface Appointment { _id: string; queueNumber: number; status: string; patient: Patient; }
interface DecodedToken { id: string; role: string; clinicId: string; }

const DoctorDashboardPage = () => {
  const [activeQueue, setActiveQueue] = useState<Appointment[]>([]);
  const [dailyHistory, setDailyHistory] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'queue' | 'calendar'>('queue');

  const fetchQueueData = useCallback(async () => {
    try {
      setLoading(true);
      const [activeResponse, historyResponse] = await Promise.all([
        apiClient.get('/appointments/queue/active'),
        apiClient.get('/appointments/queue/history'),
      ]);
      setActiveQueue(activeResponse.data);
      setDailyHistory(historyResponse.data);
    } catch (err) {
      setError('Gagal mengambil data antrean.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'queue') {
      fetchQueueData();
    }
  }, [viewMode, fetchQueueData]);

  // (useEffect untuk WebSocket tidak berubah)
  useEffect(() => {
    let socket: Socket;
    const SOCKET_URL = 'http://192.168.40.217:3000';
    const token = localStorage.getItem('authToken');
    if (token) {
      socket = io(SOCKET_URL);
      const decodedToken = jwtDecode<DecodedToken>(token);
      socket.on('connect', () => socket.emit('joinRoom', decodedToken.clinicId));
      socket.on('queueUpdated', (data) => {
        setActiveQueue(data.activeQueue);
        setDailyHistory(data.dailyHistory);
      });
      socket.on('patientSkipped', (data) => {
        setNotification(`Pasien ${data.patientName} telah dipindahkan ke akhir antrean.`);
        setTimeout(() => setNotification(null), 5000);
      });
    }
    return () => { if (socket) socket.disconnect(); };
  }, []);

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/appointments/${appointmentId}/status`, { status: newStatus });
    } catch (err) {
      alert(`Gagal mengubah status ke ${newStatus}`);
    }
  };

  const handleDataSaved = () => fetchQueueData();

  return (
    <div>
      {/* Header & Navigasi Utama */}
      <div style={{ padding: '10px', backgroundColor: '#f0f0f0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard Dokter</h2>
        <nav>
          <Link to="/doctor/patients" style={{ textDecoration: 'none', color: 'blue', marginRight: '15px' }}>Daftar Pasien</Link>
          <Link to="/doctor/history" style={{ textDecoration: 'none', color: 'blue', marginRight: '15px' }}>Semua Riwayat</Link>
          <Link to="/doctor/report" style={{ textDecoration: 'none', color: 'blue', marginRight: '15px' }}>Laporan Aktivitas</Link>
          <Link to="/settings" style={{ textDecoration: 'none', color: 'blue' }}>Pengaturan</Link>
        </nav>
      </div>

      {notification && (
        <div style={{ padding: '10px', backgroundColor: '#dff0d8', color: '#3c763d', marginBottom: '15px', borderRadius: '4px', textAlign: 'center' }}>
          {notification}
        </div>
      )}

      {/* Tombol Pilihan (Tab) */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setViewMode('queue')} disabled={viewMode === 'queue'} style={{ marginRight: '10px', padding: '8px 12px', cursor: 'pointer' }}>
          Antrean Hari Ini
        </button>
        <button onClick={() => setViewMode('calendar')} disabled={viewMode === 'calendar'} style={{ padding: '8px 12px', cursor: 'pointer' }}>
          Kalender Jadwal
        </button>
      </div>

      {/* --- Tampilan Kondisional --- */}
      
      {/* Jika viewMode adalah 'queue', tampilkan semua kode antrean lama Anda */}
      {viewMode === 'queue' && (
        <div>
          {loading && <p>Memuat antrean...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!loading && !error && (
            <>
              <h4>Antrean Aktif</h4>
              {activeQueue.length > 0 ? (
                <ol>
                  {activeQueue.map((app) => (
                    <li key={app._id} style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                      <strong>No. {app.queueNumber}</strong> - {app.patient.name}
                      <span style={{ marginLeft: '15px', fontStyle: 'italic' }}>({app.status})</span>
                      <div style={{ marginTop: '5px' }}>
                        {app.status === 'SCHEDULED' && (<>
                          <button onClick={() => handleUpdateStatus(app._id, 'WAITING')}>Panggil</button>
                          <button onClick={() => handleUpdateStatus(app._id, 'SKIPPED')} style={{ marginLeft: '5px' }}>Lewati</button>
                        </>)}
                        {app.status === 'WAITING' && (<>
                          <button onClick={() => handleUpdateStatus(app._id, 'IN_PROGRESS')}>Mulai Konsultasi</button>
                          <button onClick={() => handleUpdateStatus(app._id, 'SKIPPED')} style={{ marginLeft: '5px' }}>Lewati</button>
                        </>)}
                        {app.status === 'IN_PROGRESS' && (<button onClick={() => handleUpdateStatus(app._id, 'COMPLETED')}>Selesaikan</button>)}
                      </div>
                      {app.status === 'IN_PROGRESS' && (<>
                        <EmrForm appointmentId={app._id} onEmrSaved={handleDataSaved} />
                        <ScheduleVaccinationForm patientId={app.patient._id} onScheduleSaved={handleDataSaved} />
                      </>)}
                    </li>
                  ))}
                </ol>
              ) : (<p>Tidak ada pasien dalam antrean aktif.</p>)}

              <hr />
              
              <h4>Riwayat Pasien Hari Ini</h4>
              {dailyHistory.length > 0 ? (
                <ul>
                  {dailyHistory.map((app) => (
                    <li key={app._id}>No. {app.queueNumber} - {app.patient.name} ({app.status})</li>
                  ))}
                </ul>
              ) : (<p>Belum ada riwayat pasien untuk hari ini.</p>)}
            </>
          )}
        </div>
      )}

      {/* Jika viewMode adalah 'calendar', tampilkan komponen kalender */}
      {viewMode === 'calendar' && <DoctorCalendarView />}
    </div>
  );
};

export default DoctorDashboardPage;