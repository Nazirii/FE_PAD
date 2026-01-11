import Axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const axios = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
  },
  timeout: 60000, 
});

// --- REQUEST INTERCEPTOR ---
axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
});

// --- RESPONSE INTERCEPTOR ---
axios.interceptors.response.use(
  (response: AxiosResponse) => {
    // BUG FIX: Strip leading "c" character
    // Kita cek manual apakah datanya string, tanpa perlu cast ke 'any'
    if (typeof response.data === 'string') {
      const trimmed = response.data.trim();
      if (trimmed.startsWith('c{') || trimmed.startsWith('c[')) {
        try {
          response.data = JSON.parse(trimmed.substring(1));
        } catch {
          // Silent fail jika parse gagal
        }
      }
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle error response data cleaning
    // Akses data langsung. Jika undefined, biarkan undefined.
    const responseData = error.response?.data;

    // Type Narrowing: TypeScript jadi tahu ini string setelah 'if' ini
    if (typeof responseData === 'string') {
      const trimmed = responseData.trim();
      if (trimmed.startsWith('c{') || trimmed.startsWith('c[')) {
        try {
          // Pastikan error.response ada sebelum kita timpa datanya
          if (error.response) {
            error.response.data = JSON.parse(trimmed.substring(1));
          }
        } catch {
          // Ignore
        }
      }
    }

    // Error Handling Logic
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Request timeout - Server terlalu lama merespon (> 60s)');
    } else if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    } else if (!error.response) {
      console.error('❌ Network error - Server tidak dapat dijangkau');
    }

    return Promise.reject(error);
  }
);

export default axios;