import axios from 'axios';

const api = axios.create({
  // In production, set VITE_API_URL to your deployed backend URL.
  // In local dev, this falls back to '/api' which Vite proxies to localhost:5001.
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Add a request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Session expired or invalid. Logging out...');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;