import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import AddAdminKlinikForm from '../components/AddAdminKlinikForm'; // Sesuaikan path jika perlu
// --- 1. Impor Modal Edit ---
import EditAdminKlinikModal from '../components/EditAdminKlinikModal';

interface AdminKlinikUser {
  _id: string;
  name: string;
  email: string;
  clinic: { // Assuming clinic is populated with name
    _id: string;
    name: string;
  };
  createdAt: string;
}

const AdminKlinikManagementPage: React.FC = () => {
  const [adminKlinikList, setAdminKlinikList] = useState<AdminKlinikUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 2. State untuk Modal Edit ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminKlinikUser | null>(null);
  // -----------------------------

  const fetchAdminKlinik = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/user-management/admin-klinik');
      setAdminKlinikList(response.data || []);
    } catch (err) {
      console.error("Gagal mengambil daftar Admin Klinik:", err);
      setError('Gagal memuat daftar Admin Klinik.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminKlinik();
  }, [fetchAdminKlinik]);

  const handleAdminKlinikCreated = () => {
    // Refresh the list after a new admin is created
    fetchAdminKlinik();
  };

  // --- 3. Fungsi untuk membuka modal ---
  const handleOpenEditModal = (admin: AdminKlinikUser) => {
      setEditingAdmin(admin); // Set data admin yang akan diedit
      setIsEditModalOpen(true); // Buka modal
  };
  // --------------------------------

  // --- 4. Fungsi callback setelah update sukses ---
  const handleAdminUpdated = (updatedAdmin: AdminKlinikUser) => {
      fetchAdminKlinik(); // Refresh list
      // Optional: Tampilkan pesan sukses jika perlu
      // alert(`Data untuk ${updatedAdmin.name} berhasil diperbarui.`);
  };
  // -----------------------------------------

  const handleDelete = async (userId: string, userName: string) => {
     if (!window.confirm(`Anda yakin ingin menghapus Admin Klinik "${userName}"?`)) {
       return;
     }
     try {
       await apiClient.delete(`/user-management/admin-klinik/${userId}`);
       alert(`Admin Klinik "${userName}" berhasil dihapus.`);
       fetchAdminKlinik(); // Refresh list
     } catch (err: any) {
       alert(`Gagal menghapus Admin Klinik: ${err.response?.data?.message || err.message}`);
     }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Manajemen Admin Klinik</h2>

      {/* Form Section */}
      <AddAdminKlinikForm onAdminKlinikCreated={handleAdminKlinikCreated} />

      {/* List Section */}
      <h3>Daftar Admin Klinik</h3>
      {loading && <p>Memuat daftar...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc', backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>Nama</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Klinik</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Tgl Dibuat</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {adminKlinikList.length > 0 ? (
              adminKlinikList.map((admin) => (
                <tr key={admin._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{admin.name}</td>
                  <td style={{ padding: '8px' }}>{admin.email}</td>
                  {/* Pastikan clinic.name ada */}
                  <td style={{ padding: '8px' }}>{admin.clinic?.name || admin.clinic?._id || 'N/A'}</td>
                  <td style={{ padding: '8px' }}>{new Date(admin.createdAt).toLocaleDateString('id-ID')}</td>
                  <td style={{ padding: '8px' }}>
                    {/* --- 5. Tambahkan Tombol Edit --- */}
                    <button
                       onClick={() => handleOpenEditModal(admin)} // Panggil fungsi buka modal
                       style={{ marginRight: '5px', cursor: 'pointer' }}
                    >
                       Edit
                    </button>
                    {/* ----------------------------- */}
                    <button
                      onClick={() => handleDelete(admin._id, admin.name)}
                      style={{ color: 'red', cursor: 'pointer' }}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: '8px', textAlign: 'center' }}>
                  Belum ada Admin Klinik.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* --- 6. Render Modal Edit --- */}
      <EditAdminKlinikModal
         isOpen={isEditModalOpen}
         admin={editingAdmin}
         onClose={() => setIsEditModalOpen(false)} // Callback untuk menutup modal
         onUpdated={handleAdminUpdated}          // Callback setelah update
      />
      {/* ------------------------- */}
    </div>
  );
};

export default AdminKlinikManagementPage;