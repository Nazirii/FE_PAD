"use client";

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

// 1. FIX TYPESCRIPT: Definisikan tipe props secara eksplisit
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Ambil token langsung untuk pengecekan kondisi render (Derived State)
  // Ini aman dilakukan di top-level component client-side
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    // Jangan jalan kalau AuthContext masih loading
    if (isLoading) return;

    // 2. LOGIKA REDIRECT
    // Jika User Kosong DAN Token Gak Ada -> Tendang
    if (!user && !token) {
      console.log('❌ Unauthorized (No User & No Token), redirecting...');
      router.push('/login');
      return;
    }

    // 3. LOGIKA ROLE CHECK (Hanya jalan jika user SUDAH ADA)
    if (user?.role?.name) {
      const roleName = user.role.name.toLowerCase();
      
      let correctDashboard = null;
      if (roleName === 'admin') correctDashboard = '/admin-dashboard';
      else if (roleName === 'pusdatin') correctDashboard = '/pusdatin-dashboard';
      else if (roleName === 'provinsi' || roleName === 'kabupaten/kota') correctDashboard = '/dlh-dashboard';

      if (correctDashboard && !pathname.startsWith(correctDashboard)) {
        console.log(`⚠️ User ${roleName} nyasar. Redirecting ke: ${correctDashboard}`);
        router.push(correctDashboard);
      }
    }

  }, [user, isLoading, router, pathname, token]);

  // --- TAMPILAN (RENDER LOGIC) ---

  // Definisi "Sedang Sync": User belum ada di state, TAPI token ada di storage.
  // Ini kondisi yang bikin blank putih kalau tidak ditangani.
  const isSyncing = !user && token;

  // Tampilkan Loading jika:
  // 1. AuthContext sedang loading
  // 2. Sedang Sync (Token ada tapi User null)
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

  // Safety net terakhir: Jika user null dan token null, return null (karena useEffect akan me-redirect)
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