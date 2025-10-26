import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import EmrForm from './EmrForm';
import ScheduleVaccinationForm from './ScheduleVaccinationForm';
import ScheduleFollowUpForm from './ScheduleFollowUpForm';
import { io, Socket } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { Link } from 'react-router-dom';
import DoctorCalendarView from './DoctorCalendarView';

// --- Interface dan Komponen RegistrationControl tidak berubah ---
interface ClinicProfile {
    _id: string;
    isRegistrationClosed?: boolean;
    registrationCloseTime?: string | null;
}
interface RegistrationControlProps {
    clinicProfile: ClinicProfile | null;
    onUpdate: (updatedProfile: ClinicProfile) => void;
}
const RegistrationControl: React.FC<RegistrationControlProps> = ({ clinicProfile, onUpdate }) => {
    // ... (kode di dalam komponen ini tidak ada perubahan)
    const [closeTime, setCloseTime] = useState('17:00');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCloseNow = async () => {
        if (!window.confirm('Anda yakin ingin menutup pendaftaran sekarang?')) return;
        setIsSubmitting(true);
        try {
            const response = await apiClient.patch('/clinics/my-clinic/close-registration-now');
            onUpdate(response.data);
            alert('Pendaftaran berhasil ditutup.');
        } catch (err) {
            alert('Gagal menutup pendaftaran.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenNow = async () => {
        setIsSubmitting(true);
        try {
            const response = await apiClient.patch('/clinics/my-clinic/open-registration');
            onUpdate(response.data);
            alert('Pendaftaran berhasil dibuka kembali.');
        } catch (err) {
            alert('Gagal membuka pendaftaran.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleScheduleClose = async () => {
        if (!closeTime) {
            alert('Silakan masukkan jam penutupan.');
            return;
        }
        setIsSubmitting(true);
        try {
            const [hours, minutes] = closeTime.split(':');
            const scheduleDate = new Date();
            scheduleDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            const response = await apiClient.patch('/clinics/my-clinic/schedule-closing', { closeTime: scheduleDate });
            onUpdate(response.data);
            alert(`Pendaftaran akan ditutup otomatis pada pukul ${closeTime}.`);
        } catch (err) {
            alert('Gagal menjadwalkan penutupan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    let statusText = 'Dibuka';
    let statusColor = 'green';
    if (clinicProfile?.isRegistrationClosed) {
        statusText = 'Ditutup Manual';
        statusColor = 'red';
    } else if (clinicProfile?.registrationCloseTime) {
        const scheduledTime = new Date(clinicProfile.registrationCloseTime);
        if (new Date() > scheduledTime) {
            statusText = `Ditutup Otomatis (dijadwalkan pukul ${scheduledTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`;
            statusColor = 'red';
        } else {
            statusText = `Akan Ditutup pukul ${scheduledTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
            statusColor = 'orange';
        }
    }

    const isEffectivelyClosed = clinicProfile?.isRegistrationClosed || (clinicProfile?.registrationCloseTime && new Date() > new Date(clinicProfile.registrationCloseTime));

    return (
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', marginBottom: '20px', backgroundColor: '#fafafa' }}>
            <h4>Manajemen Pendaftaran Hari Ini</h4>
            <p>Status Saat Ini: <strong style={{ color: statusColor }}>{statusText}</strong></p>
            {!isEffectivelyClosed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={handleCloseNow} disabled={isSubmitting} style={{ backgroundColor: '#ff4d4d', color: 'white' }}>Tutup Sekarang</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} disabled={isSubmitting} />
                        <button onClick={handleScheduleClose} disabled={isSubmitting}>Jadwalkan Penutupan</button>
                    </div>
                </div>
            )}
            {isEffectivelyClosed && (
                <button onClick={handleOpenNow} disabled={isSubmitting} style={{ backgroundColor: '#5cb85c', color: 'white' }}>Buka Kembali Pendaftaran</button>
            )}
        </div>
    );
};


interface Patient { _id: string; name: string; }
interface Appointment { _id: string; queueNumber: number; status: string; patient: Patient; }
interface DecodedToken { id: string; role: string; clinicId: string; }

const DoctorDashboardPage = () => {
    const [activeQueue, setActiveQueue] = useState<Appointment[]>([]);
    const [onHoldQueue, setOnHoldQueue] = useState<Appointment[]>([]);
    const [dailyHistory, setDailyHistory] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'queue' | 'calendar'>('queue');
    const [clinicProfile, setClinicProfile] = useState<ClinicProfile | null>(null);
    const [doctorInfo, setDoctorInfo] = useState<DecodedToken | null>(null);
    
    // 1. Simpan koneksi socket di dalam state agar bisa diakses di mana saja
    const [socket, setSocket] = useState<Socket | null>(null);

    const fetchInitialData = useCallback(async () => {
        try {
            setLoading(true);
            const [activeResponse, onHoldResponse, historyResponse, profileResponse] = await Promise.all([
                apiClient.get('/appointments/queue/active'),
                apiClient.get('/appointments/queue/on-hold'),
                apiClient.get('/appointments/queue/history'),
                apiClient.get('/auth/profile/me'),
            ]);
            setActiveQueue(activeResponse.data);
            setOnHoldQueue(onHoldResponse.data);
            setDailyHistory(historyResponse.data);
            if (profileResponse.data.clinic) {
                setClinicProfile(profileResponse.data.clinic);
            }
        } catch (err) {
            setError('Gagal mengambil data dashboard.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (viewMode === 'queue') {
            fetchInitialData();
        }
    }, [viewMode, fetchInitialData]);

    useEffect(() => {
        const SOCKET_URL = 'http://10.189.192.217:3000';
        // const SOCKET_URL = 'http://192.168.1.6:3000';
        
        const token = localStorage.getItem('authToken');

        if (token) {
            const decoded = jwtDecode<DecodedToken>(token);
            setDoctorInfo(decoded);
            
            // 2. Kirim token saat koneksi WebSocket dibuat
            const newSocket = io(SOCKET_URL, {
                extraHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });

            setSocket(newSocket); // Simpan socket ke state

            newSocket.on('connect', () => newSocket.emit('joinRoom', decoded.clinicId));
            
            newSocket.on('queueUpdated', (data) => {
                setActiveQueue(data.activeQueue);
                setOnHoldQueue(data.onHoldQueue);
                setDailyHistory(data.dailyHistory);
            });

            newSocket.on('patientSkipped', (data) => {
                setNotification(`Pasien ${data.patientName} telah dipindahkan ke antrean On Hold.`);
                setTimeout(() => setNotification(null), 5000);
            });
        }

        return () => {
            // Gunakan socket dari state untuk disconnect
            if (socket) {
                socket.disconnect();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
        try {
            await apiClient.patch(`/appointments/${appointmentId}/status`, { status: newStatus });
        } catch (err) {
            alert(`Gagal mengubah status ke ${newStatus}`);
        }
    };

    const handleStartConsultation = async (appointment: Appointment) => {
    try {
        // Step 1: Ubah status janji temu menjadi IN_PROGRESS (via API)
        console.log(`Mengubah status appointment ${appointment._id} menjadi IN_PROGRESS`);
        await apiClient.patch(`/appointments/${appointment._id}/status`, { status: 'IN_PROGRESS' });

        // --- [PERBAIKAN DI SINI] ---
        // Step 2: Update 'nowServing' di klinik (via API)
        console.log(`Mengupdate nowServing ke ${appointment.queueNumber}`);
        await apiClient.patch('/clinics/my-clinic/now-serving', { queueNumber: appointment.queueNumber });
        // -----------------------------

        // Tidak perlu emit WebSocket dari sini, karena update status
        // di atas sudah memicu 'queue.updated' dari backend

    } catch (err: any) { // Tangkap error
        alert('Gagal memulai konsultasi. Silakan coba lagi.');
        // Log error yang lebih detail
        console.error("Error starting consultation:", err.response?.data || err.message || err);
    }
    };

    const handleDataSaved = () => {
        fetchInitialData();
    };

    const handleClinicUpdate = (updatedClinicProfile: ClinicProfile) => {
        setClinicProfile(updatedClinicProfile);
    };

    return (
        // ... (bagian JSX di bawah sini tidak ada perubahan) ...
        <div>
            <div style={{ padding: '10px', backgroundColor: '#f0f0f0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Dashboard Dokter</h2>
                <nav>
                    <Link to="/doctor/patients" style={{ textDecoration: 'none', color: 'blue', marginRight: '15px' }}>Daftar Pasien</Link>
                    <Link to="/vaccines" style={{ textDecoration: 'none', color: 'blue', marginRight: '15px' }}>Manajemen Vaksin</Link>
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
            <RegistrationControl clinicProfile={clinicProfile} onUpdate={handleClinicUpdate} />
            <div style={{ marginBottom: '20px' }}>
                <button onClick={() => setViewMode('queue')} disabled={viewMode === 'queue'} style={{ marginRight: '10px', padding: '8px 12px', cursor: 'pointer' }}>Antrean Hari Ini</button>
                <button onClick={() => setViewMode('calendar')} disabled={viewMode === 'calendar'} style={{ padding: '8px 12px', cursor: 'pointer' }}>Kalender Jadwal</button>
            </div>
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
                                                    <button onClick={() => handleStartConsultation(app)}>Mulai Konsultasi</button>
                                                    <button onClick={() => handleUpdateStatus(app._id, 'SKIPPED')} style={{ marginLeft: '5px' }}>Lewati</button>
                                                </>)}
                                                {app.status === 'IN_PROGRESS' && (<button onClick={() => handleUpdateStatus(app._id, 'COMPLETED')}>Selesaikan</button>)}
                                            </div>
                                            {app.status === 'IN_PROGRESS' && doctorInfo && (
                                                <>
                                                    <EmrForm appointmentId={app._id} onEmrSaved={handleDataSaved} />
                                                    <ScheduleVaccinationForm patientId={app.patient._id} onScheduleSaved={handleDataSaved} />
                                                    <ScheduleFollowUpForm
                                                        patientId={app.patient._id}
                                                        doctorId={doctorInfo.id}
                                                        clinicId={doctorInfo.clinicId}
                                                        onScheduleSaved={handleDataSaved}
                                                    />
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            ) : (<p>Tidak ada pasien dalam antrean aktif.</p>)}
                            <hr style={{ margin: '20px 0' }}/>
                            <h4>Antrean On Hold</h4>
                            {onHoldQueue.length > 0 ? (
                                <ol>
                                    {onHoldQueue.map((app) => (
                                        <li key={app._id} style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px', backgroundColor: '#fffbe6' }}>
                                            <strong>No. {app.queueNumber}</strong> - {app.patient.name}
                                            <span style={{ marginLeft: '15px', fontStyle: 'italic' }}>({app.status})</span>
                                            <div style={{ marginTop: '5px' }}>
                                                <button onClick={() => handleUpdateStatus(app._id, 'WAITING')}>Panggil Kembali</button>
                                                <button onClick={() => handleUpdateStatus(app._id, 'SKIPPED')} style={{ marginLeft: '5px' }}>Lewati (Pindah ke Belakang)</button>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            ) : (<p>Tidak ada pasien dalam antrean on hold.</p>)}
                            <hr style={{ margin: '20px 0' }}/>
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
            {viewMode === 'calendar' && <DoctorCalendarView />}
        </div>
    );
};

export default DoctorDashboardPage;