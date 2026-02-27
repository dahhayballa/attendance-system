import { useState, useEffect, useCallback } from 'react';
import { getScheduleStats } from '../../../services/supabase/schedule.service';
import { getAttendanceLogs } from '../../../services/supabase/attendance.service';
import { ScheduleStats, AttendanceLog } from '../../../types';

export const useStats = () => {
    const [stats, setStats] = useState<ScheduleStats>({
        total: 0,
        recorded: 0,
        pending: 0,
        rate: 0,
        present: 0,
        absent: 0
    });
    const [recentLogs, setRecentLogs] = useState<AttendanceLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [statsData, logsData] = await Promise.all([
                getScheduleStats(),
                getAttendanceLogs({ limit: 10 })
            ]);

            setStats(statsData);
            setRecentLogs(logsData);
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            setError('فشل في تحميل إحصائيات لوحة التحكم');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return { stats, recentLogs, loading, error, refetch: fetchDashboardData };
};
