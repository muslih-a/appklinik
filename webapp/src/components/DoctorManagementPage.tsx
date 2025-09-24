import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import AddDoctorForm from './AddDoctorForm';

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

const DoctorManagementPage = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/doctors');
      setDoctors(response.data);
    } catch (err) {
      setError('Gagal mengambil data dokter.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Nama fungsi ini digunakan saat form berhasil (baik tambah maupun edit)
  const handleFormSuccess = () => {
    fetchDoctors();
    setIsFormVisible(false);
    setEditingDoctor(null); // Bersihkan mode edit setelah sukses
  };

  const handleDelete = async (doctorId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus dokter ini?')) {
      try {
        await apiClient.delete(`/doctors/${doctorId}`);
        alert('Dokter berhasil dihapus.');
        fetchDoctors();
      } catch (err) {
        alert('Gagal menghapus dokter.');
        console.error(err);
      }
    }
  };

  const handleEditClick = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setIsFormVisible(true);
  };

  const handleToggleForm = () => {
    setIsFormVisible(!isFormVisible);
    if (isFormVisible) {
      setEditingDoctor(null);
    }
  };

  if (loading) return <p>Memuat data dokter...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h3>Manajemen Dokter</h3>
      {doctors.length > 0 ? (
        <ul>
          {doctors.map((doctor) => (
            <li key={doctor._id}>
              <strong>{doctor.name}</strong> ({doctor.email}) - Bertugas di: {doctor.clinic.name}
              
              {/* Tambahkan tombol Edit */}
              <button onClick={() => handleEditClick(doctor)} style={{ marginLeft: '10px' }}>
                Edit
              </button>
              <button onClick={() => handleDelete(doctor._id)} style={{ marginLeft: '5px' }}>
                Hapus
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Belum ada data dokter.</p>
      )}

      <hr />

      {isFormVisible && (
        <AddDoctorForm 
          onDoctorAdded={handleFormSuccess} // Gunakan nama fungsi yang benar
          doctorToEdit={editingDoctor} 
        />
      )}

      {/* Gunakan handleToggleForm agar mode edit dibersihkan saat dibatalkan */}
      <button onClick={handleToggleForm} style={{ marginTop: '10px' }}>
        {isFormVisible ? 'Batal' : 'Tambah Dokter Baru'}
      </button>
    </div>
  );
};

export default DoctorManagementPage;