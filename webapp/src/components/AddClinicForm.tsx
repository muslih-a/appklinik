import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

interface Clinic {
  _id: string;
  name: string;
  address: string;
  phoneNumber?: string;
}

interface AddClinicFormProps {
  onClinicAdded: () => void; // Kita tetap gunakan nama ini untuk kesederhanaan
  clinicToEdit?: Clinic | null;
}

const AddClinicForm: React.FC<AddClinicFormProps> = ({ onClinicAdded, clinicToEdit }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clinicToEdit) {
      setName(clinicToEdit.name);
      setAddress(clinicToEdit.address);
      setPhoneNumber(clinicToEdit.phoneNumber || '');
    } else {
      setName('');
      setAddress('');
      setPhoneNumber('');
    }
  }, [clinicToEdit]);

  // --- PERUBAHAN UTAMA DI FUNGSI INI ---
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const clinicData = { name, address, phoneNumber };

    try {
      if (clinicToEdit) {
        // Jika dalam mode edit, kirim permintaan PATCH
        await apiClient.patch(`/clinics/${clinicToEdit._id}`, clinicData);
        alert('Klinik berhasil diperbarui!');
      } else {
        // Jika mode buat baru, kirim permintaan POST
        await apiClient.post('/clinics', clinicData);
        alert('Klinik baru berhasil ditambahkan!');
      }
      onClinicAdded(); // Panggil fungsi dari parent untuk refresh & tutup form
    } catch (err) {
      setError('Gagal menyimpan data. Coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px' }}>
      <h4>{clinicToEdit ? 'Form Edit Klinik' : 'Form Tambah Klinik Baru'}</h4>
      <div>
        <label>Nama Klinik:</label><br />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div style={{ marginTop: '10px' }}>
        <label>Alamat:</label><br />
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
      </div>
      <div style={{ marginTop: '10px' }}>
        <label>Nomor Telepon:</label><br />
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      <button type="submit" disabled={loading} style={{ marginTop: '15px' }}>
        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
      </button>
    </form>
  );
};

export default AddClinicForm;