import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { Folder } from '../lib/types';

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFolders = useCallback(async () => {
    try {
      const data = await apiFetch('/folders');
      if (data) setFolders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  async function createFolder(name: string, parentId: string | null = null) {
    try {
      const data = await apiFetch('/folders', {
        method: 'POST',
        body: JSON.stringify({ name, parent_id: parentId }),
      });
      if (data) setFolders(prev => [...prev, data]);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async function renameFolder(id: string, name: string) {
    try {
      await apiFetch(`/folders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      });
      setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }

  async function deleteFolder(id: string) {
    try {
      await apiFetch(`/folders/${id}`, { method: 'DELETE' });
      setFolders(prev => prev.filter(f => f.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }

  return { folders, loading, createFolder, renameFolder, deleteFolder, refetch: fetchFolders };
}
