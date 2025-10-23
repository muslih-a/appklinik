import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // 1. Impor Link
import apiClient from '../api/apiClient';

interface NotificationSettings {
  isScheduledReminderActive: boolean;
  h1ReminderTime: string;
  dayHReminderTime: string;
  realtimeReminderThreshold: number;
}

const NotificationSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/settings');
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        alert('Gagal mengambil data pengaturan.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setIsSaving(true);
      await apiClient.patch('/settings', settings);
      alert('Pengaturan berhasil disimpan!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (settings) {
      let finalValue: string | boolean | number = value;
      if (type === 'checkbox') {
        finalValue = checked;
      } else if (type === 'number') {
        finalValue = parseInt(value, 10) || 0;
      }

      setSettings({
        ...settings,
        [name]: finalValue,
      });
    }
  };
  
  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  if (!settings) {
    return <div>Could not load settings. Please try again later.</div>;
  }

  return (
    <div>
      {/* 2. Tambahkan Link Kembali di sini */}
      <div style={{ marginBottom: '20px' }}>
        <Link to="/dashboard">&larr; Kembali ke Dashboard</Link>
      </div>

      <h2>Pengaturan Notifikasi Pengingat</h2>
      <p>Atur jadwal pengiriman notifikasi otomatis untuk pasien.</p>
      <hr />

      <form onSubmit={handleSaveChanges}>
        <div>
          <label>
            <input
              type="checkbox"
              name="isScheduledReminderActive"
              checked={settings.isScheduledReminderActive}
              onChange={handleChange}
            />
            {' '}
            Aktifkan Semua Pengingat Otomatis
          </label>
        </div>
        <br />
        
        <h4>Pengingat Terjadwal</h4>
        <div>
          <label htmlFor="h1ReminderTime">Waktu Pengingat H-1 (Sehari Sebelumnya):</label>
          <br />
          <input
            type="time"
            id="h1ReminderTime"
            name="h1ReminderTime"
            value={settings.h1ReminderTime}
            onChange={handleChange}
            disabled={!settings.isScheduledReminderActive}
          />
        </div>
        <br />
        <div>
          <label htmlFor="dayHReminderTime">Waktu Pengingat Hari-H (Pagi Hari):</label>
          <br />
          <input
            type="time"
            id="dayHReminderTime"
            name="dayHReminderTime"
            value={settings.dayHReminderTime}
            onChange={handleChange}
            disabled={!settings.isScheduledReminderActive}
          />
        </div>
        <br />

        <h4>Pengingat Real-time</h4>
        <div>
          <label htmlFor="realtimeReminderThreshold">
            Kirim notifikasi jika giliran kurang dari (menit):
          </label>
          <br />
          <input
            type="number"
            id="realtimeReminderThreshold"
            name="realtimeReminderThreshold"
            value={settings.realtimeReminderThreshold}
            onChange={handleChange}
            disabled={!settings.isScheduledReminderActive}
            min="1"
          />
        </div>
        <br />

        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
};

export default NotificationSettingsPage;