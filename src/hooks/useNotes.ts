import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { Note } from '../lib/types';

export function useNotes(folderId?: string | null) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/notes');
      if (data) {
        // Filter by folder if specified
        const filtered = folderId === undefined
          ? data
          : data.filter((n: any) => n.folder_id === folderId);
        setNotes(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  async function createNote(title: string, fId: string | null = null) {
    try {
      const data = await apiFetch('/notes', {
        method: 'POST',
        body: JSON.stringify({ title, content: '', folder_id: fId }),
      });
      if (data) setNotes(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async function updateNote(id: string, fields: Partial<Pick<Note, 'title' | 'content' | 'folder_id'>>) {
    try {
      const data = await apiFetch(`/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(fields),
      });
      if (data) setNotes(prev => prev.map(n => n.id === id ? { ...n, ...fields } : n));
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }

  async function deleteNote(id: string) {
    try {
      await apiFetch(`/notes/${id}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }

  return { notes, loading, createNote, updateNote, deleteNote, refetch: fetchNotes };
}

export async function fetchAllNotes() {
  try {
    const data = await apiFetch('/notes');
    return data ?? [];
  } catch (err) {
    console.error(err);
    return [];
  }
}
