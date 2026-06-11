import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://ai-crypto-advisor-production-c0c8.up.railway.app/api',
    headers: {
      'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
      const token = useAuthStore.getState().token;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
      const publicPaths = ['/login', '/register'];
      const isOnPublicPage = publicPaths.includes(window.location.pathname);

      if (error.response && error.response.status === 401 && !isOnPublicPage) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
);
  
export default api;