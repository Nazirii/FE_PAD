"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import axios from '@/lib/axios';
import SintaFullLogo from '@/components/SintaFullLogo.js';
import { useAuth } from '@/context/AuthContext'; // 🔥 Import useAuth

const EyeIcon = () => (
  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.625-5.06A9.954 9.954 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.268 5.768M4 12s2.943-7 8-7 8 7 8 7-2.943 7-8 7-8-7-8-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth(); // 🔥 Ambil setUser dari context
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post('/api/login', { email, password });
      
      // Save token & user data
      const token = response.data.user.token;
      const user = response.data.user;
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));

      // 🔥 UPDATE STATE CONTEXT MANUAL BIAR GAK PERLU REFRESH
      setUser(user);
      
      // Redirect based on role
      const roleName = user.role?.name?.toLowerCase();
      console.log('🔐 Login successful, role:', roleName);
      
      if (roleName === 'admin') {
        router.push('/admin-dashboard');
      } else if (roleName === 'pusdatin') {
        router.push('/pusdatin-dashboard');
      } else if (roleName === 'provinsi' || roleName === 'kabupaten/kota') {
        router.push('/dlh-dashboard');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const message = err.response?.data?.message || 'Login gagal. Silakan coba lagi.';
        setError(message);
      } else {
        setError('Terjadi kesalahan yang tidak terduga.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-12 px-4 space-y-8">
      
      <div className="flex justify-center">
        <SintaFullLogo />
      </div>

      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-xl w-full max-w-md text-center border border-gray-300">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Login</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Field Email */}
          <div>
            <label htmlFor="email" className="block text-left text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email" 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan Email" 
              required 
              disabled={loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A86B] focus:border-[#00A86B] sm:text-sm disabled:bg-gray-50"
            />
          </div>

          {/* Field Password */}
          <div>
            <label htmlFor="password" className="block text-left text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type={showPassword ? "text" : "password"}
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
                disabled={loading}
                className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00A86B] focus:border-[#00A86B] sm:text-sm disabled:bg-gray-50"
              />
              
              <div
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </div>
            </div>
            <div className="text-right mt-2 text-sm">
              <Link href="/lupa-password" className="font-semibold text-[#00A86B] hover:underline">
                Lupa password?
              </Link>
            </div>
          </div>

          {/* Tombol Login */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00A86B] text-white font-bold py-3 px-4 rounded-lg hover:brightness-90 transition duration-300 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </div>
        </form>

        {/* Bagian Daftar */}
        <div className="mt-8 text-sm text-center">
          <p className="text-gray-600 mb-4">Belum memiliki akun?</p>
          <Link
            href="/register"
            className="inline-block bg-[#00A86B] text-white font-bold py-3 px-6 rounded-lg hover:brightness-90 transition duration-300 shadow-sm"
          >
            Daftar Sekarang
          </Link>
        </div>

      </div>
    </main>
  );
}