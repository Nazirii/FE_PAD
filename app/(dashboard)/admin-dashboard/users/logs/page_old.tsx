'use client';

import { useState, useEffect, useMemo } from 'react';
import StatCard from '@/components/StatCard';
import LastActivityCard, { Log } from '@/components/LastActivityCard';
import Pagination from '@/components/Pagination';
import axios from '@/lib/axios';
import { FiSearch } from 'react-icons/fi';

const LOGS_PER_PAGE = 25;
const CACHE_DURATION = 2 * 60 * 1000; // 2 menit untuk logs

interface CacheEntry {
  data: any;
  timestamp: number;
}

const dataCache: Record<string, CacheEntry> = {};

const statCardColors = [
  { bg: 'bg-slate-50', border: 'border-slate-300', titleColor: 'text-slate-600', valueColor: 'text-slate-800' },
  { bg: 'bg-green-50', border: 'border-green-300', titleColor: 'text-green-600', valueColor: 'text-green-800' },
];

export default function UsersLogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Statistik
  const [stats, setStats] = useState({
    totalLogs: 0,
    pusdatinLogs: 0,
  });

  // Helper: Check cache validity
  const isCacheValid = (key: string): boolean => {
    if (!dataCache[key]) return false;
    const age = Date.now() - dataCache[key].timestamp;
    return age < CACHE_DURATION;
  };

  // Fetch data dari API
  useEffect(() => {
    const fetchLogs = async () => {
      const cacheKey = 'admin-logs';
      
      // Check cache
      if (isCacheValid(cacheKey)) {
        const cachedData = dataCache[cacheKey].data;
        setLogs(cachedData);
        
        // Hitung stats
        const pusdatinLogs = cachedData.filter((log: Log) => 
          log.role?.toLowerCase() === 'pusdatin'
        );
        
        setStats({
          totalLogs: cachedData.length,
          pusdatinLogs: pusdatinLogs.length,
        });
        
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/admin/logs');
        const data: Log[] = Array.isArray(res.data) ? res.data : res.data.data;

        // Store in cache
        dataCache[cacheKey] = {
          data,
          timestamp: Date.now()
        };

        // Filter hanya Pusdatin
        const pusdatinLogs = data.filter(log => 
          log.role?.toLowerCase() === 'pusdatin'
        );

        setLogs(data);
        setStats({
          totalLogs: data.length,
          pusdatinLogs: pusdatinLogs.length,
        });
      } catch (error) {
        console.error('Gagal mengambil data log:', error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Filter logs - HANYA Pusdatin
  const filteredLogs = useMemo(() => {
    let result = logs.filter(log => 
      log.role?.toLowerCase() === 'pusdatin'
    );

    // // Filter by search term
    // if (searchTerm) {
    //   const lowerTerm = searchTerm.toLowerCase();
    //   result = result.filter(log => 
    //     log.user_name?.toLowerCase().includes(lowerTerm) ||
    //     log.action?.toLowerCase().includes(lowerTerm) ||
    //     log.description?.toLowerCase().includes(lowerTerm)
    //   );
    // }

    return result;
  }, [logs, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * LOGS_PER_PAGE;
    return filteredLogs.slice(start, start + LOGS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Stats Data
  const statsData = [
    { title: 'Total Semua Log', value: stats.totalLogs },
    { title: 'Log Aktivitas Pusdatin', value: stats.pusdatinLogs },
  ];

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <h1 className="text-3xl font-extrabold text-slate-800">Memuat Log...</h1>
        <div className="h-64 bg-gray-100 animate-pulse rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-extrabold text-slate-800">Log Aktivitas Pusdatin</h1>
        <p className="text-gray-600">Riwayat aktivitas pengguna Pusdatin dalam sistem.</p>
      </header>

      {/* Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statsData.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value ?? 0}
            {...statCardColors[index]}
          />
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center mb-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama user, aksi, atau deskripsi..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Log Table */}
      {paginatedLogs.length > 0 ? (
        <LastActivityCard
          logs={paginatedLogs}
          // title="Aktivitas Terbaru Pusdatin"
          // showRole={false}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            {searchTerm ? 'Tidak ada log yang cocok dengan pencarian' : 'Belum ada log aktivitas Pusdatin'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {paginatedLogs.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-600">
            Menampilkan {paginatedLogs.length} dari {filteredLogs.length} log
          </span>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            siblings={1}
          />
        </div>
      )}
    </div>
  );
}
