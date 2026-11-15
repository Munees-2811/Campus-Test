import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5s — fail fast so UI never hangs
});

// Request interceptor: Attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campustest_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Centralized error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const customError = {
      message: 'An unexpected error occurred. Please try again.',
      status: error.response?.status,
      data: error.response?.data
    };

    if (error.response?.data?.message) {
      customError.message = error.response.data.message;
    } else if (error.message) {
      customError.message = error.message;
    }

    // Auto logout on 401 if token expired or invalid
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('campustest_token');
      localStorage.removeItem('campustest_user');
      window.location.href = '/login?expired=1';
    }

    return Promise.reject(customError);
  }
);

export default api;
