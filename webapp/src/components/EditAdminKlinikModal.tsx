import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

interface Clinic {
  _id: string;
  name: string;
}

interface AdminKlinikUser {
  _id: string;
  name: string;
  email: string; // Email tidak diubah, hanya ditampilkan
  clinic: {
    _id: string;
    name?: string; // Nama mungkin tidak selalu ada tergantung populate
  };
}

interface EditAdminKlinikModalProps {
  admin: AdminKlinikUser | null; // Data admin yang akan diedit
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedAdmin: any) => void; // Callback setelah update sukses
}

const EditAdminKlinikModal: React.FC<EditAdminKlinikModalProps> = ({ admin, isOpen, onClose, onUpdated }) => {
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState(''); // Untuk reset password
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch clinics saat modal pertama kali mau dibuka (jika belum ada)
  useEffect(() => {
    if (isOpen && clinics.length === 0) {
      const fetchClinics = async () => {
        setLoadingClinics(true);
        try {
          const response = await apiClient.get('/clinics');
          setClinics(response.data || []);
        } catch (err) {
          console.error("Gagal mengambil daftar klinik:", err);
          setError('Gagal memuat daftar klinik.');
        } finally {
          setLoadingClinics(false);
        }
      };
      fetchClinics();
    }
  }, [isOpen, clinics.length]); // Re-fetch jika modal buka & clinics kosong

  // Pre-fill form saat data 'admin' berubah (saat modal dibuka)
  useEffect(() => {
    if (admin) {
      setName(admin.name);
      setSelectedClinicId(admin.clinic?._id || ''); // Handle jika clinic null/undefined
      setNewPassword(''); // Kosongkan password setiap buka modal
      setError(null); // Reset error
    }
  }, [admin]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!admin) return; // Seharusnya tidak terjadi jika modal terbuka

    setError(null);
    setSubmitting(true);

    const payload: { name?: string; clinicId?: string; password?: string } = {};
    if (name !== admin.name) payload.name = name;
    if (selectedClinicId !== admin.clinic?._id) payload.clinicId = selectedClinicId;
    if (newPassword) payload.password = newPassword; // Hanya kirim jika diisi

    // Jangan kirim request jika tidak ada perubahan
    if (Object.keys(payload).length === 0) {
        setError('Tidak ada perubahan data.');
        setSubmitting(false);
        return;
    }

    try {
      const response = await apiClient.patch(`/user-management/admin-klinik/${admin._id}`, payload);
      onUpdated(response.data); // Panggil callback sukses
      onClose(); // Tutup modal
    } catch (err: any) {
      console.error("Gagal mengupdate Admin Klinik:", err);
      setError(`Gagal mengupdate: ${err.response?.data?.message || 'Terjadi kesalahan.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Jangan render modal jika tidak isOpen atau tidak ada data admin
  if (!isOpen || !admin) {
    return null;
  }

  // Basic Modal Styling (bisa diganti dengan library UI seperti Material UI, Chakra UI, dll.)
  const modalStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  };
  const contentStyle: React.CSSProperties = {
    background: 'white', padding: '30px', borderRadius: '8px',
    width: '90%', maxWidth: '500px',
  };

  return (
    <div style={modalStyle}>
      <div style={contentStyle}>
        <h3>Edit Admin Klinik: {admin.name}</h3>
        <p>Email: {admin.email} (tidak dapat diubah)</p>
        <hr style={{ margin: '15px 0' }}/>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="edit-name">Nama:</label><br />
            <input
              id="edit-name" type="text" value={name}
              onChange={(e) => setName(e.target.value)} required
              style={{ width: '95%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="edit-password">Password Baru (opsional):</label><br />
            <input
              id="edit-password" type="password" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Kosongkan jika tidak ingin mengubah"
              minLength={6}
              style={{ width: '95%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="edit-clinic">Klinik:</label><br />
            <select
              id="edit-clinic" value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)} required
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

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} disabled={submitting}>
              Batal
            </button>
            <button type="submit" disabled={submitting || loadingClinics} style={{ fontWeight: 'bold' }}>
              {submitting ? 'Menyimpan...' : 'Update Admin Klinik'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAdminKlinikModal;