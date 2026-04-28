export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const savedUser = localStorage.getItem('aura_user');
  const user = savedUser ? JSON.parse(savedUser) : null;
  
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (user?.id) {
    headers['x-user-id'] = user.id;
  }

  // Only add content-type if it's not a multipart upload (handled by browser)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
  return res.json();
}
