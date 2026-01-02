import Axios from 'axios';

const axios = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 detik timeout untuk mencegah request hang
});

// Token interceptor
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - strip leading "c" dari backend bug
axios.interceptors.response.use((response) => {
  // console.log('=== RAW RESPONSE DATA ===');
  // console.log('Type:', typeof response.data);
  // console.log('Data:', response.data);
  // console.log('First 20 chars:', JSON.stringify(response.data).substring(0, 20));
  
  // Jika response.data adalah string yang dimulai dengan "c{" atau "c["
  if (typeof response.data === 'string') {
    const trimmed = response.data.trim();
    console.log('Trimmed starts with c{?', trimmed.startsWith('c{'));
    console.log('Trimmed starts with c[?', trimmed.startsWith('c['));
    
    if (trimmed.startsWith('c{') || trimmed.startsWith('c[')) {
      try {
        // Parse JSON setelah strip "c"
        const parsed = JSON.parse(trimmed.substring(1));
        // console.log('✅ Successfully stripped "c" and parsed:', parsed);
        response.data = parsed;
      } catch (e) {
        // Jika gagal parse, biarkan original
        console.warn('❌ Failed to parse response after stripping "c":', e);
      }
    }
  }
  
  // console.log('=== FINAL RESPONSE DATA ===');
  // console.log('Data:', response.data);
  // console.log('========================\n');
  
  return response;
}, (error) => {
  // Parse error response data juga (untuk 422, 400, dll)
  if (error.response?.data && typeof error.response.data === 'string') {
    const trimmed = error.response.data.trim();
    if (trimmed.startsWith('c{') || trimmed.startsWith('c[')) {
      try {
        error.response.data = JSON.parse(trimmed.substring(1));
      } catch (e) {
        console.warn('❌ Failed to parse error response:', e);
      }
    }
  }
  
  // Better error handling
  if (error.code === 'ECONNABORTED') {
    console.error('Request timeout - server tidak merespon dalam 10 detik');
  } else if (error.response?.status === 401) {
    // Unauthorized - hapus token yang invalid
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  } else if (!error.response) {
    console.error('Network error - server tidak dapat dijangkau');
  }
  
  return Promise.reject(error);
});

export default axios;
