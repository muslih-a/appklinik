import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

interface Clinic {
  _id: string;
  name: string;
}

interface AddAdminKlinikFormProps {
  onAdminKlinikCreated: () => void; // Callback after successful creation
}

const AddAdminKlinikForm: React.FC<AddAdminKlinikFormProps> = ({ onAdminKlinikCreated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch clinics for the dropdown
  useEffect(() => {
    const fetchClinics = async () => {
      setLoadingClinics(true);
      try {
        const response = await apiClient.get('/clinics'); // Assuming GET /clinics returns all clinics (for Admin)
        setClinics(response.data || []);
        if (response.data?.length > 0) {
           // Optionally set a default selected clinic
           // setSelectedClinicId(response.data[0]._id);
        }
      } catch (err) {
        console.error("Gagal mengambil daftar klinik:", err);
        setError('Gagal memuat daftar klinik.');
      } finally {
        setLoadingClinics(false);
      }
    };
    fetchClinics();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email || !password || !selectedClinicId) {
      setError('Semua field wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        email,
        password,
        clinicId: selectedClinicId,
      };
      // Call the backend endpoint created earlier
      await apiClient.post('/user-management/admin-klinik', payload);

      setSuccess(`Admin Klinik "${name}" berhasil dibuat.`);
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setSelectedClinicId('');
      // Notify parent component
      onAdminKlinikCreated();

    } catch (err: any) {
      console.error("Gagal membuat Admin Klinik:", err);
      const errorMessage = err.response?.data?.message || 'Terjadi kesalahan.';
      // Handle specific errors like email conflict
      if (errorMessage.toLowerCase().includes('email already exists')) {
         setError('Email ini sudah terdaftar. Gunakan email lain.');
      } else {
         setError(`Gagal membuat Admin Klinik: ${errorMessage}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      <h3>Tambah Admin Klinik Baru</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="name">Nama:</label><br />
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '95%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="email">Email:</label><br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '95%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="password">Password:</label><br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '95%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="clinic">Pilih Klinik:</label><br />
          <select
            id="clinic"
            value={selectedClinicId}
            onChange={(e) => setSelectedClinicId(e.target.value)}
            required
            disabled={loadingClinics}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="" disabled>
              {loadingClinics ? 'Memuat klinik...' : '-- Pilih Klinik --'}
            </option>
            {clinics.map((clinic) => (
              <option key={clinic._id} value={clinic._id}>
                {clinic.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        <button type="submit" disabled={submitting || loadingClinics}>
          {submitting ? 'Menyimpan...' : 'Buat Admin Klinik'}
        </button>
      </form>
    </div>
  );
};

export default AddAdminKlinikForm;