import { useState, useEffect, useCallback } from 'react';
import { apiFetch, API_URL } from '../lib/api';
import { FileRecord } from '../lib/types';

export function useFiles(folderId?: string | null) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/files');
      if (data) {
        const filtered = folderId === undefined
          ? data
          : data.filter((f: any) => f.folder_id === folderId);
        setFiles(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  async function uploadFile(file: File, fId: string | null = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (fId) formData.append('folder_id', fId);

      const data = await apiFetch('/files', {
        method: 'POST',
        body: formData,
      });
      
      if (data) setFiles(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async function deleteFile(id: string, _fileUrl: string) {
    try {
      await apiFetch(`/files/${id}`, { method: 'DELETE' });
      setFiles(prev => prev.filter(f => f.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }

  async function getSignedUrl(fileUrl: string) {
    // Local server serves files directly via static middleware
    return fileUrl;
  }

  return { files, loading, uploadFile, deleteFile, getSignedUrl, refetch: fetchFiles };
}
