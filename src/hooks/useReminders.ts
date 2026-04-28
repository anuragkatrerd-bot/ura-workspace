import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { Reminder } from '../lib/types';

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    try {
      const data = await apiFetch('/reminders');
      if (data) setReminders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  async function createReminder(title: string, description: string = '', remindAt: string | null = null) {
    try {
      const data = await apiFetch('/reminders', {
        method: 'POST',
        body: JSON.stringify({ title, description, remind_at: remindAt }),
      });
      if (data) setReminders(prev => [...prev, data]);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async function updateReminder(id: string, fields: Partial<Reminder>) {
    try {
      const data = await apiFetch(`/reminders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(fields),
      });
      if (data) setReminders(prev => prev.map(r => r.id === id ? { ...r, ...fields } : r));
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }

  async function deleteReminder(id: string) {
    try {
      await apiFetch(`/reminders/${id}`, { method: 'DELETE' });
      setReminders(prev => prev.filter(r => r.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }

  return { reminders, loading, createReminder, updateReminder, deleteReminder, refetch: fetchReminders };
}
