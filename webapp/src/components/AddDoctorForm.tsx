import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

interface AddDoctorFormProps {
  onDoctorAdded: () => void;
  doctorToEdit?: Doctor | null;
}

interface Clinic {
  _id: string;
  name: string;
}
interface Doctor {
  _id: string;
  name: string;
  email: string;
  clinic: Clinic;
}

const AddDoctorForm: React.FC<AddDoctorFormProps> = ({ onDoctorAdded, doctorToEdit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [clinicsList, setClinicsList] = useState<Clinic[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mengisi form jika dalam mode edit
    if (doctorToEdit) {
      setName(doctorToEdit.name);
      setEmail(doctorToEdit.email);
      // Menggunakan optional chaining (?) untuk mencegah error jika clinic null
      setClinicId(doctorToEdit.clinic?._id || ''); 
      setPassword('');
    }
  }, [doctorToEdit]);

  useEffect(() => {
    // Mengambil daftar klinik untuk dropdown
    const fetchClinics = async () => {
      try {
        const response = await apiClient.get('/clinics');
        setClinicsList(response.data);
      } catch (err) {
        console.error("Failed to fetch clinics", err);
        setError("Gagal memuat daftar klinik.");
      }
    };
    fetchClinics();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!doctorToEdit && !password) {
      setError("Password wajib diisi untuk dokter baru.");
      return;
    }
    setLoading(true);
    setError('');

    const payload: any = {
      name,
      email,
      role: 'Doctor',
    };
    
    if (password) payload.password = password;
    if (clinicId) payload.clinicId = clinicId;

    try {
      if (doctorToEdit) {
        // --- [PERBAIKAN ENDPOINT EDIT] ---
        // Menggunakan alamat yang benar untuk update user oleh admin
        await apiClient.patch(`/auth/admin/users/${doctorToEdit._id}`, payload);
        alert('Dokter berhasil diperbarui!');
      } else {
        await apiClient.post('/auth/admin/create-user', payload);
        alert('Dokter baru berhasil ditambahkan!');
      }
      onDoctorAdded();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px' }}>
      <h4>{doctorToEdit ? 'Form Edit Dokter' : 'Form Tambah Dokter Baru'}</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <label>Tugaskan ke Klinik (Opsional):</label><br />
        <select value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
          <option value="">-- Pilih Klinik --</option>
          {clinicsList.map(clinic => (
            <option key={clinic._id} value={clinic._id}>
              {clinic.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Nama Dokter:</label><br />
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div style={{ marginTop: '10px' }}>
        <label>Email:</label><br />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div style={{ marginTop: '10px' }}>
        <label>Password {doctorToEdit ? '(Kosongkan jika tidak diubah)' : ''}:</label><br />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required={!doctorToEdit} />
      </div>
      
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      
      <button type="submit" disabled={loading} style={{ marginTop: '15px' }}>
        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
      </button>
    </form>
  );
};

export default AddDoctorForm;