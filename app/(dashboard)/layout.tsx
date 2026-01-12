"use client";

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading, checkAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 1. DERIVED STATE (Hitung di awal)
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  // isSyncing = Kita punya token, tapi User di context masih null. 
  // Artinya sedang proses "menghidupkan" user kembali.
  const isSyncing = !user && token;

  // 2. EFFECT 1: SAFETY NET / SYNCING
  // Tugas: Memanggil checkAuth jika kondisi syncing terdeteksi
  useEffect(() => {
    if (isSyncing && !isLoading) {
        // console.log('🔄 Syncing user state...');
        checkAuth();
    }
  }, [isSyncing, isLoading, checkAuth]);

  // 3. EFFECT 2: REDIRECT & ROLE CHECK
  useEffect(() => {
    // JANGAN JALAN jika masih Loading ATAU sedang Syncing
    // Kita hapus 'isChecked' dan ganti pakai logika ini.
    if (isLoading || isSyncing) return;

    // A. LOGIKA KICK (Unauthorized)
    // Cek token lagi langsung dari storage untuk keamanan ganda
    const currentToken = localStorage.getItem('auth_token');
    if (!user && !currentToken) {
      // console.log('❌ Unauthorized, redirecting...');
      router.push('/login');
      return;
    }

    // B. LOGIKA ROLE CHECK (Salah Kamar)
    if (user?.role?.name) {
      const roleName = user.role.name.toLowerCase();
      
      let correctDashboard = null;
      if (roleName === 'admin') correctDashboard = '/admin-dashboard';
      else if (roleName === 'pusdatin') correctDashboard = '/pusdatin-dashboard';
      else if (roleName === 'provinsi' || roleName === 'kabupaten/kota') correctDashboard = '/dlh-dashboard';

      if (correctDashboard && !pathname.startsWith(correctDashboard)) {
        console.log(`⚠️ Redirecting ${roleName} to ${correctDashboard}`);
        router.push(correctDashboard);
      }
    }

  }, [user, isLoading, isSyncing, router, pathname]); // Dependency updated

  // --- TAMPILAN ---

  // Tampilkan Loading jika Context Loading ATAU sedang Sync data user
  if (isLoading || isSyncing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium animate-pulse">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <main className="flex-grow">
          {children}
        </main>
    </div>
  );
}