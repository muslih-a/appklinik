import React, { useState } from 'react';
import apiClient from '../api/apiClient';

interface Props {
  patientId: string;
  doctorId: string;
  clinicId: string;
  onScheduleSaved: () => void;
}

const ScheduleFollowUpForm: React.FC<Props> = ({ patientId, doctorId, clinicId, onScheduleSaved }) => {
  const [appointmentTime, setAppointmentTime] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!appointmentTime) {
      setError('Tanggal dan waktu kunjungan wajib diisi.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await apiClient.post('/appointments', {
        patientId,
        doctorId,
        clinicId,
        appointmentTime,
      });
      alert('Jadwal kunjungan lanjutan berhasil disimpan!');
      setAppointmentTime('');
      onScheduleSaved(); // Memberi tahu parent component untuk refresh data jika perlu
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Gagal menyimpan jadwal. Silakan coba lagi.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '20px', border: '1px solid #28a745', padding: '15px', borderRadius: '5px' }}>
      <h4>Jadwalkan Kunjungan Lanjutan</h4>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="appointmentTime">Tanggal & Waktu Kunjungan:</label><br />
          <input
            type="datetime-local"
            id="appointmentTime"
            value={appointmentTime}
            onChange={(e) => setAppointmentTime(e.target.value)}
            style={{ padding: '8px', width: '95%' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Jadwal'}
        </button>
      </form>
    </div>
  );
};

export default ScheduleFollowUpForm;