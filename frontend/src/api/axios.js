import axios from 'axios';

const explicitApiBaseUrl = process.env.REACT_APP_API_BASE_URL?.trim();

const normalizeBaseUrl = (url) => url.replace(/\/+$/, '');

const getApiBaseUrl = () => {
  if (explicitApiBaseUrl) {
    return normalizeBaseUrl(explicitApiBaseUrl);
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocalHost) {
      return 'http://localhost:8000/api';
    }

    // In production, use same-origin so reverse proxy /api works.
    return '/api';
  }

  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
