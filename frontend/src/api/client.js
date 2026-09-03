import axios from 'axios';

/**
 * Normalizes the API Base URL:
 * - Strips trailing slashes
 * - Automatically appends '/api' if missing from an absolute URL (e.g., https://my-backend.onrender.com -> https://my-backend.onrender.com/api)
 * - Defaults to '/api' for local development (Vite proxy) or unified fullstack container deployments
 */
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl || typeof envUrl !== 'string' || !envUrl.trim()) {
    return '/api';
  }
  let cleanUrl = envUrl.trim().replace(/\/+$/, '');
  if (!cleanUrl.endsWith('/api') && cleanUrl.startsWith('http')) {
    cleanUrl = `${cleanUrl}/api`;
  }
  return cleanUrl;
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s timeout to allow Render free tier wakeups
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hatsun_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('hatsun_token');
      localStorage.removeItem('hatsun_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

