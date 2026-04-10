import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../../services/supabase/admin.service';

export interface GlobalStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  recorded: number;
  rate: number;
}

export interface StatsFilters {
  day?: string;
  weekId?: string;
  teacher?: string;
  className?: string;
  subject?: string;
  isLive?: boolean;
  exactDateStart?: string;
  exactDateEnd?: string;
}

const initialStats: GlobalStats = {
  total: 0,
  present: 0,
  absent: 0,
  late: 0,
  recorded: 0,
  rate: 0
};

export const useGlobalStats = (filters: StatsFilters) => {
  const [stats, setStats] = useState<GlobalStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getGlobalStats(filters);
      setStats(data as GlobalStats);
      setError(null);
    } catch (err) {
      console.error('Error fetching global stats:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]); // Deep compare filters

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};
