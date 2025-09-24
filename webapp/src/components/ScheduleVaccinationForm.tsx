import React, { useState } from 'react';
import apiClient from '../api/apiClient';

interface Props {
  patientId: string;
  onScheduleSaved: () => void; // Fungsi untuk memberitahu parent bahwa jadwal berhasil disimpan
}

const ScheduleVaccinationForm: React.FC<Props> = ({ patientId, onScheduleSaved }) => {
  const [vaccineName, setVaccineName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!vaccineName || !scheduledDate) {
      setError('Nama vaksin dan tanggal wajib diisi.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await apiClient.post('/scheduled-vaccinations', {
        vaccineName,
        scheduledDate,
        patientId,
      });
      alert('Jadwal vaksinasi berhasil disimpan!');
      // Kosongkan form dan panggil fungsi sukses
      setVaccineName('');
      setScheduledDate('');
      onScheduleSaved();
    } catch (err) {
      setError('Gagal menyimpan jadwal. Coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '20px', border: '1px solid #007bff', padding: '15px', borderRadius: '5px' }}>
      <h4>Jadwalkan Vaksinasi Berikutnya</h4>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Nama Vaksin:</label><br />
          <input
            type="text"
            value={vaccineName}
            onChange={(e) => setVaccineName(e.target.value)}
            style={{ width: '95%', padding: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Tanggal Jadwal:</label><br />
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            style={{ padding: '5px' }}
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

export default ScheduleVaccinationForm;