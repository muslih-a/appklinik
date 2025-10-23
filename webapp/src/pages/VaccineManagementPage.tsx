import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext'; // Impor useAuth yang asli

// Interface untuk tipe data
interface User { _id: string; name: string; }
interface Clinic { _id: string; name: string; }
interface Vaccine {
  _id: string;
  name: string;
  description?: string;
  minAgeMonths: number;
  maxAgeMonths?: number;
  dosesRequired: number;
  clinic?: Clinic;
  createdBy: User;
}

const VaccineManagementPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<Vaccine | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minAgeMonths: '0',
    maxAgeMonths: '',
    dosesRequired: '1',
    clinicId: '',
  });

  const fetchVaccines = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/vaccines');
      setVaccines(response.data);
      setError('');
    } catch (err) {
      setError('Gagal mengambil data vaksin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchVaccines();
      if (user.role === 'Admin') {
        const fetchClinics = async () => {
          try {
            const response = await apiClient.get('/clinics');
            setClinics(response.data);
          } catch (err) {
            console.error("Gagal mengambil data klinik.", err);
          }
        };
        fetchClinics();
      }
    }
  }, [fetchVaccines, user]);

  const handleOpenModal = (vaccine: Vaccine | null = null) => {
    setEditingVaccine(vaccine);
    if (vaccine) {
      setFormData({
        name: vaccine.name,
        description: vaccine.description || '',
        minAgeMonths: String(vaccine.minAgeMonths),
        maxAgeMonths: vaccine.maxAgeMonths ? String(vaccine.maxAgeMonths) : '',
        dosesRequired: String(vaccine.dosesRequired),
        clinicId: vaccine.clinic?._id || '',
      });
    } else {
      setFormData({ name: '', description: '', minAgeMonths: '0', maxAgeMonths: '', dosesRequired: '1', clinicId: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVaccine(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: formData.name,
      description: formData.description,
      minAgeMonths: parseInt(formData.minAgeMonths, 10),
      maxAgeMonths: formData.maxAgeMonths ? parseInt(formData.maxAgeMonths, 10) : undefined,
      dosesRequired: parseInt(formData.dosesRequired, 10),
      clinicId: formData.clinicId || undefined,
    };

    try {
      if (editingVaccine) {
        await apiClient.patch(`/vaccines/${editingVaccine._id}`, payload);
      } else {
        await apiClient.post('/vaccines', payload);
      }
      fetchVaccines();
      handleCloseModal();
    } catch (err) {
      alert('Gagal menyimpan data vaksin.');
    }
  };

  const handleDelete = async (vaccineId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus vaksin ini?')) {
      try {
        await apiClient.delete(`/vaccines/${vaccineId}`);
        fetchVaccines();
      } catch (err) {
        alert('Gagal menghapus vaksin.');
      }
    }
  };

  if (isAuthLoading || loading) return <p>Memuat...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!user) return <p>Sesi tidak valid, silakan login kembali.</p>;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        {user.role === 'Admin' ? (
          <Link to="/dashboard">&larr; Kembali ke Dashboard</Link>
        ) : (
          <Link to="/doctor/dashboard">&larr; Kembali ke Dashboard</Link>
        )}
      </div>
      <h2>Manajemen Vaksin</h2>
      
      {user.role === 'Admin' && (
        <button onClick={() => handleOpenModal()} style={{ marginBottom: '20px' }}>
          + Tambah Vaksin Baru
        </button>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid black' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Nama Vaksin</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Klinik</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Rentang Usia (Bulan)</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Dosis</th>
            {user.role === 'Admin' && <th style={{ textAlign: 'left', padding: '8px' }}>Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {vaccines.map((vaccine) => (
            <tr key={vaccine._id} style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '8px' }}>{vaccine.name}</td>
              <td style={{ padding: '8px' }}>{vaccine.clinic?.name || 'Global'}</td>
              <td style={{ padding: '8px' }}>{vaccine.minAgeMonths} - {vaccine.maxAgeMonths || 'Seterusnya'}</td>
              <td style={{ padding: '8px' }}>{vaccine.dosesRequired}</td>
              {user.role === 'Admin' && (
                <td style={{ padding: '8px' }}>
                  <button onClick={() => handleOpenModal(vaccine)}>Ubah</button>
                  <button onClick={() => handleDelete(vaccine._id)} style={{ marginLeft: '5px' }}>
                    Hapus
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && user.role === 'Admin' && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.content}>
            <h3>{editingVaccine ? 'Ubah Vaksin' : 'Tambah Vaksin Baru'}</h3>
            <form onSubmit={handleSubmit} style={modalStyles.form}>
              <div style={modalStyles.formGroup}>
                <label htmlFor="clinicId">Tugaskan ke Klinik</label>
                <select name="clinicId" id="clinicId" value={formData.clinicId} onChange={handleFormChange}>
                  <option value="">-- Untuk Semua Klinik (Global) --</option>
                  {clinics.map(clinic => (
                    <option key={clinic._id} value={clinic._id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={modalStyles.formGroup}>
                <label htmlFor="name">Nama Vaksin</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleFormChange} required />
              </div>
              <div style={modalStyles.formGroup}>
                <label htmlFor="description">Deskripsi (Opsional)</label>
                <textarea name="description" id="description" value={formData.description} onChange={handleFormChange} />
              </div>
              <div style={modalStyles.formGroup}>
                <label htmlFor="minAgeMonths">Usia Minimum (Bulan)</label>
                <input type="number" name="minAgeMonths" id="minAgeMonths" value={formData.minAgeMonths} onChange={handleFormChange} required min="0" />
              </div>
              <div style={modalStyles.formGroup}>
                <label htmlFor="maxAgeMonths">Usia Maksimum (Bulan, kosongkan jika tidak ada)</label>
                <input type="number" name="maxAgeMonths" id="maxAgeMonths" value={formData.maxAgeMonths} onChange={handleFormChange} min="0" />
              </div>
              <div style={modalStyles.formGroup}>
                <label htmlFor="dosesRequired">Jumlah Dosis</label>
                <input type="number" name="dosesRequired" id="dosesRequired" value={formData.dosesRequired} onChange={handleFormChange} required min="1" />
              </div>
              <div style={{ marginTop: '20px' }}>
                <button type="submit">Simpan</button>
                <button type="button" onClick={handleCloseModal} style={{ marginLeft: '10px' }}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const modalStyles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  content: {
    backgroundColor: 'white', padding: '20px 30px', borderRadius: '8px', width: '90%', maxWidth: '500px',
  },
  form: {
    display: 'flex', flexDirection: 'column', gap: '15px'
  },
  formGroup: {
    display: 'flex', flexDirection: 'column', gap: '5px'
  }
};

export default VaccineManagementPage;