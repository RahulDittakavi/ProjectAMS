import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('ams_auth');
  const headers = config.headers ?? {};
  let updatedHeaders = { ...headers } as Record<string, string>;

  if (raw) {
    try {
      const auth = JSON.parse(raw);
      updatedHeaders.Authorization = `Bearer ${auth.token}`;
    } catch {
      localStorage.removeItem('ams_auth');
    }
  }

  config.headers = updatedHeaders as any;
  return config;
});

export default api;
