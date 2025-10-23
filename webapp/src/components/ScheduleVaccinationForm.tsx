import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

interface VaccineSuggestion {
  _id: string;
  name: string;
}

interface Props {
  patientId: string;
  onScheduleSaved: () => void;
}

const ScheduleVaccinationForm: React.FC<Props> = ({ patientId, onScheduleSaved }) => {
  // State untuk menyimpan daftar saran vaksin dari API
  const [suggestions, setSuggestions] = useState<VaccineSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  // State untuk form
  const [selectedVaccineName, setSelectedVaccineName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fungsi untuk mengambil saran vaksin berdasarkan ID pasien
  const fetchSuggestions = useCallback(async (id: string) => {
    setLoadingSuggestions(true);
    try {
      const response = await apiClient.get(`/vaccines/suggestions?patientId=${id}`);
      setSuggestions(response.data);
    } catch (err) {
      console.error('Gagal mengambil saran vaksin:', err);
      // Jangan tampilkan error ke user, cukup dropdown kosong
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  // Ambil saran saat komponen pertama kali dimuat atau saat patientId berubah
  useEffect(() => {
    if (patientId) {
      fetchSuggestions(patientId);
    }
  }, [patientId, fetchSuggestions]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedVaccineName || !scheduledDate) {
      setError('Nama vaksin dan tanggal wajib dipilih.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await apiClient.post('/scheduled-vaccinations', {
        vaccineName: selectedVaccineName,
        scheduledDate,
        patientId,
      });
      alert('Jadwal vaksinasi berhasil disimpan!');
      setSelectedVaccineName('');
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
          <label>Nama Vaksin (Sesuai Usia Pasien):</label><br />
          {loadingSuggestions ? (
            <p>Memuat saran vaksin...</p>
          ) : (
            <select
              value={selectedVaccineName}
              onChange={(e) => setSelectedVaccineName(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
              required
            >
              <option value="" disabled>-- Pilih Vaksin --</option>
              {suggestions.map((vaccine) => (
                <option key={vaccine._id} value={vaccine.name}>
                  {vaccine.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Tanggal Jadwal:</label><br />
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            style={{ padding: '5px' }}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading || loadingSuggestions}>
          {loading ? 'Menyimpan...' : 'Simpan Jadwal'}
        </button>
      </form>
    </div>
  );
};

export default ScheduleVaccinationForm;