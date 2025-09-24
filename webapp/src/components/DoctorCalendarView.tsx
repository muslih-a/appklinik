import React, { useState, useCallback } from 'react';
import * as BigCalendar from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { id } from 'date-fns/locale/id';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import apiClient from '../api/apiClient';

type CalendarEvent = BigCalendar.Event & { type?: 'appointment' | 'vaccination' };

const locales = {
  'id': id,
};
const localizer = BigCalendar.dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: id }),
  getDay,
  locales,
});

// Tipe data untuk jadwal gabungan dari backend
interface CombinedScheduleItem {
  id: string;
  title: string;
  start: string; // Backend mengirim sebagai string
  end: string;   // Backend mengirim sebagai string
  type: 'appointment' | 'vaccination';
}

const DoctorCalendarView = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState('');

  const fetchEvents = useCallback(async (start: Date, end: Date) => {
    try {
      setError('');
      const response = await apiClient.get('/appointments/schedule/my', {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      });

      // Konversi data dari backend (dengan date string) ke format kalender (dengan Date object)
      const formattedEvents: CalendarEvent[] = response.data.map((item: CombinedScheduleItem) => ({
        title: item.title,
        start: new Date(item.start), // Konversi string ke Date
        end: new Date(item.end),     // Konversi string ke Date
        resource: item, // Simpan data asli
        type: item.type,
      }));
      setEvents(formattedEvents);
    } catch (err) {
      setError('Gagal memuat data jadwal.');
      console.error(err);
    }
  }, []);

  // --- 1. Fungsi untuk memberi warna pada event ---
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#2196f3'; // Biru untuk janji temu (default)
    if (event.type === 'vaccination') {
      backgroundColor = '#4caf50'; // Hijau untuk vaksinasi
    }
    const style = {
      backgroundColor,
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
    };
    return {
      style: style,
    };
  };

  const handleRangeChange = useCallback((range: any) => {
    const start = Array.isArray(range) ? range[0] : range.start;
    const end = Array.isArray(range) ? range[range.length - 1] : range.end;
    fetchEvents(start, end);
  }, [fetchEvents]);

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ height: '70vh' }}>
        <BigCalendar.Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          culture='id'
          onRangeChange={handleRangeChange}
          // --- 2. Terapkan fungsi pewarnaan di sini ---
          eventPropGetter={eventStyleGetter}
        />
      </div>
    </div>
  );
};

export default DoctorCalendarView;