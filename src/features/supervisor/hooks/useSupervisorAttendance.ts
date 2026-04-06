import { useState, useEffect, useCallback } from 'react';
import { getSchedules, recordAttendance, getTodayStats } from '../services/attendanceService';
import type { Schedule, FilterOptions } from '../types';
import { useAuth } from '../../auth/hooks/useAuth';

export const useSupervisorAttendance = () => {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, pending: 0, rate: 0 });
    const [filters, setFilters] = useState<Partial<FilterOptions>>({});

    const fetchSchedules = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [schedulesData, statsData] = await Promise.all([
                getSchedules(filters),
                getTodayStats(),
            ]);
            setSchedules(schedulesData);
            setStats(statsData);
        } catch (err: any) {
            console.error('[useAttendance] Erreur:', err);
            setError('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    const markAttendance = useCallback(async (
        scheduleId: string,
        status: 'present' | 'absent' | 'late' | 'excused'
    ) => {
        if (!user) return { success: false };

        try {
            setMarkingId(scheduleId);
            await recordAttendance(scheduleId, status, user.id);

            // Mise à jour optimiste
            setSchedules(prev =>
                prev.map(s => s.id === scheduleId ? { ...s, status: 'completed' as const } : s)
            );
            setStats(prev => ({
                ...prev,
                present: prev.present + 1,
                pending: prev.pending - 1,
                rate: prev.total > 0 ? Math.round(((prev.present + 1) / prev.total) * 100) : 0,
            }));

            return { success: true };
        } catch (err: any) {
            console.error('[useAttendance] Erreur enregistrement:', err);
            return { success: false, error: err.message };
        } finally {
            setMarkingId(null);
        }
    }, [user]);

    const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters({});
    }, []);

    return {
        schedules,
        loading,
        error,
        markingId,
        stats,
        filters,
        markAttendance,
        updateFilters,
        resetFilters,
        refetch: fetchSchedules,
    };
};
