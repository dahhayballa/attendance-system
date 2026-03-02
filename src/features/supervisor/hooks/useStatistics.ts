import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';

/* ═══════════ Types ═══════════ */

export interface PeriodStats {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
}

export interface TopAbsentee {
    teacher: string;
    absences: number;
    totalClasses: number;
    rate: number;
}

export interface ClassDistribution {
    class: string;
    present: number;
    absent: number;
    total: number;
}

export interface DailyTrend {
    day: string;
    present: number;
    absent: number;
    total: number;
}

export interface StatisticsData {
    overall: PeriodStats & { percentage: number };
    byPeriod: {
        today: PeriodStats;
        week: PeriodStats;
        month: PeriodStats;
    };
    topAbsentees: TopAbsentee[];
    byClass: ClassDistribution[];
    dailyTrend: DailyTrend[];
    loading: boolean;
    error: string | null;
}

const EMPTY_PERIOD: PeriodStats = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };

/**
 * Hook pour calculer toutes les statistiques d'attendance
 * depuis la table schedules.
 */
export const useStatistics = (): StatisticsData & { refetch: () => void } => {
    const [state, setState] = useState<StatisticsData>({
        overall: { ...EMPTY_PERIOD, percentage: 0 },
        byPeriod: { today: EMPTY_PERIOD, week: EMPTY_PERIOD, month: EMPTY_PERIOD },
        topAbsentees: [],
        byClass: [],
        dailyTrend: [],
        loading: true,
        error: null,
    });

    const computeStats = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            // Récupérer toutes les données pertinentes
            const { data: schedules, error } = await supabase
                .from('schedules')
                .select('id, day, teacher, subject, class, status, recorded_at, created_at');

            if (error) throw error;
            if (!schedules) return;

            const now = new Date();
            const todayStr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][now.getDay()];

            // ═══ Overall ═══
            const overall = computePeriodStats(schedules);

            // ═══ Today ═══
            const todaySchedules = schedules.filter(s => s.day === todayStr);
            const today = computePeriodStats(todaySchedules);

            // ═══ Week (derniers 7 jours de données) ═══
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekSchedules = schedules.filter(s => {
                if (!s.created_at) return true; // Inclure si pas de date
                return new Date(s.created_at) >= weekAgo;
            });
            const week = computePeriodStats(weekSchedules);

            // ═══ Month (derniers 30 jours) ═══
            const monthAgo = new Date(now);
            monthAgo.setDate(monthAgo.getDate() - 30);
            const monthSchedules = schedules.filter(s => {
                if (!s.created_at) return true;
                return new Date(s.created_at) >= monthAgo;
            });
            const month = computePeriodStats(monthSchedules);

            // ═══ Top absentees ═══
            const teacherMap = new Map<string, { absences: number; total: number }>();
            schedules.forEach(s => {
                if (!s.teacher) return;
                const entry = teacherMap.get(s.teacher) || { absences: 0, total: 0 };
                entry.total++;
                if (s.status === 'absent') entry.absences++;
                teacherMap.set(s.teacher, entry);
            });

            const topAbsentees = Array.from(teacherMap.entries())
                .map(([teacher, data]) => ({
                    teacher,
                    absences: data.absences,
                    totalClasses: data.total,
                    rate: data.total > 0 ? Math.round((data.absences / data.total) * 100) : 0,
                }))
                .filter(t => t.absences > 0)
                .sort((a, b) => b.absences - a.absences)
                .slice(0, 5);

            // ═══ Distribution par classe ═══
            const classMap = new Map<string, { present: number; absent: number; total: number }>();
            schedules.forEach(s => {
                if (!s.class) return;
                const entry = classMap.get(s.class) || { present: 0, absent: 0, total: 0 };
                entry.total++;
                if (s.status === 'present' || s.status === 'completed') entry.present++;
                else if (s.status === 'absent') entry.absent++;
                classMap.set(s.class, entry);
            });

            const byClass = Array.from(classMap.entries())
                .map(([cls, data]) => ({ class: cls, ...data }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 8);

            // ═══ Tendance journalière ═══
            const dayOrder = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            const dailyTrend = dayOrder.map(day => {
                const daySchedules = schedules.filter(s => s.day === day);
                return {
                    day,
                    present: daySchedules.filter(s => s.status === 'present' || s.status === 'completed').length,
                    absent: daySchedules.filter(s => s.status === 'absent').length,
                    total: daySchedules.length,
                };
            }).filter(d => d.total > 0);

            setState({
                overall: { ...overall, percentage: overall.total > 0 ? Math.round((overall.present / overall.total) * 100) : 0 },
                byPeriod: { today, week, month },
                topAbsentees,
                byClass,
                dailyTrend,
                loading: false,
                error: null,
            });
        } catch (err: any) {
            console.error('[useStatistics] Erreur:', err);
            setState(prev => ({ ...prev, loading: false, error: 'فشل في تحميل الإحصائيات' }));
        }
    }, []);

    useEffect(() => { computeStats(); }, [computeStats]);

    // Realtime
    useEffect(() => {
        const channel = supabase
            .channel('stats_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => computeStats())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => computeStats())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [computeStats]);

    return { ...state, refetch: computeStats };
};

function computePeriodStats(data: any[]): PeriodStats {
    let present = 0, absent = 0, late = 0, excused = 0;
    data.forEach(s => {
        if (s.status === 'present' || s.status === 'completed') present++;
        else if (s.status === 'absent') absent++;
        else if (s.status === 'late') late++;
        else if (s.status === 'excused') excused++;
    });
    return { present, absent, late, excused, total: data.length };
}
