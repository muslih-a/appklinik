import React, { useState } from 'react';
import apiClient from '../api/apiClient';

interface EmrFormProps {
  appointmentId: string;
  onEmrSaved: () => void;
}

const EmrForm: React.FC<EmrFormProps> = ({ appointmentId, onEmrSaved }) => {
  // --- 1. Ganti nama state agar sesuai standar ---
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      // --- 2. Kirim data dengan nama properti yang benar ---
      const emrData = { symptoms, diagnosis, treatment };
      await apiClient.patch(`/appointments/${appointmentId}/emr`, emrData);
      
      await apiClient.patch(`/appointments/${appointmentId}/status`, { status: 'COMPLETED' });

      alert('Rekam Medis berhasil disimpan dan janji temu telah diselesaikan.');
      onEmrSaved();

    } catch (err) {
      setError('Gagal menyimpan rekam medis.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid green', padding: '10px', marginTop: '10px' }}>
      <h5>Rekam Medis Elektronik (EMR)</h5>
      <form onSubmit={handleSubmit}>
        <div>
          {/* --- 3. Ganti label agar konsisten --- */}
          <label>Gejala (Symptoms):</label><br />
          <textarea 
            value={symptoms} 
            onChange={(e) => setSymptoms(e.target.value)} 
            rows={3} 
            style={{ width: '95%' }} 
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>Diagnosis:</label><br />
          <input 
            type="text" 
            value={diagnosis} 
            onChange={(e) => setDiagnosis(e.target.value)} 
            style={{ width: '95%' }} 
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>Pengobatan / Resep (Treatment):</label><br />
          <textarea 
            value={treatment} 
            onChange={(e) => setTreatment(e.target.value)} 
            rows={3} 
            style={{ width: '95%' }} 
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ marginTop: '10px' }}>
          {loading ? 'Menyimpan...' : 'Simpan EMR & Selesaikan'}
        </button>
      </form>
    </div>
  );
};

export default EmrForm;