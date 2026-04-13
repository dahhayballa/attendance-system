import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useRole } from '../../features/auth/hooks/useRole';
import { adminService } from '../../services/supabase/admin.service';

export interface StatsKPI {
    totalSessions: number;
    totalPresence: number;
    onTime: number;
    late: number;
    absent: number;
    totalCriticalAlerts: number;
}

export interface StatsRates {
    presenceRate: number;
    lateRate: number;
    absenceRate: number;
}

export interface AlertRecord {
    id: string;
    type: string;
    professor_name: string;
    message: string;
    severity: 'low' | 'high' | 'critical';
    created_at: string;
}

export interface DailyTrend {
    date: string;
    presence: number;
    late: number;
    absence: number;
}

export interface GroupedStat {
    name: string;
    onTime: number;
    late: number;
    absent: number;
    total: number;
    rate: number;
}

export interface FilterOptions {
    teachers: string[];
    classes: string[];
    subjects: string[];
}

export interface FilterState {
    teacher: string;
    subject: string;
    class: string;
}

export interface StatisticsData {
    kpis: StatsKPI;
    rates: StatsRates;
    recentAlerts: AlertRecord[];
    dailyTrend: DailyTrend[];
    byClass: GroupedStat[];
    byTeacher: GroupedStat[];
    bySubject: GroupedStat[];
    advanced: {
        avgPoints: number;
        avgDelay: number;
        totalNotifications: number;
        unreadNotifications: number;
    };
    options: FilterOptions;
    loading: boolean;
    error: string | null;
}

const INITIAL_KPIS: StatsKPI = { totalSessions: 0, totalPresence: 0, onTime: 0, late: 0, absent: 0, totalCriticalAlerts: 0 };
const INITIAL_RATES: StatsRates = { presenceRate: 0, lateRate: 0, absenceRate: 0 };

export const useStatistics = () => {
    const { user } = useAuth();
    const { isAdmin, isSupervisor, isSurveillance } = useRole();
    
    const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
    const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
    
    // Week navigation: track Monday of the displayed week
    const getMondayOf = (d: Date) => {
        const date = new Date(d);
        const diff = (date.getDay() + 6) % 7;
        date.setDate(date.getDate() - diff);
        date.setHours(0, 0, 0, 0);
        return date;
    };
    const [customWeekStart, setCustomWeekStart] = useState<Date>(() => getMondayOf(new Date()));
    const goToPrevWeek = useCallback(() => setCustomWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; }), []);
    const goToNextWeek = useCallback(() => setCustomWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; }), []);
    
    const [filters, setFiltersState] = useState<FilterState>({
        teacher: 'all',
        subject: 'all',
        class: 'all'
    });

    const setFilters = useCallback((newFilters: FilterState | ((prev: FilterState) => FilterState)) => {
        setFiltersState(prev => {
            const updated = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
            
            // If teacher changes, reset subject and class to ensure valid cascade
            if (updated.teacher !== prev.teacher) {
                return { ...updated, subject: 'all', class: 'all' };
            }
            // If subject changes, reset class
            if (updated.subject !== prev.subject) {
                return { ...updated, class: 'all' };
            }
            return updated;
        });
    }, []);
    
    const [state, setState] = useState<StatisticsData>({
        kpis: INITIAL_KPIS,
        rates: INITIAL_RATES,
        recentAlerts: [],
        dailyTrend: [],
        byClass: [],
        byTeacher: [],
        bySubject: [],
        advanced: {
            avgPoints: 0,
            avgDelay: 0,
            totalNotifications: 0,
            unreadNotifications: 0,
        },
        options: {
            teachers: [],
            classes: [],
            subjects: [],
        },
        loading: true,
        error: null,
    });

    const fetchStatistics = useCallback(async () => {
        if (!user) return;

        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            // 1. Get Supervisor scope if applicable
            let scope: { type: 'class' | 'subject' | 'all' | 'mixed', values: string[] } | null = null;
            if (isSupervisor) {
                const { data: assignments } = await supabase
                    .from('supervisor_assignments')
                    .select('*')
                    .eq('supervisor_id', user.id);
                
                if (assignments && assignments.length > 0) {
                    scope = {
                        type: assignments.length === 1 ? assignments[0].assignment_type : 'mixed',
                        values: assignments.map(a => a.assignment_value).filter(Boolean)
                    };
                }
            }

            // 2. Resolve timeframe and relevant IDs
            let startDate: Date;
            let endDate: Date;
            let weekIdForStats = 'all';
            let daysToProcess = 7;

            if (timeframe === 'day') {
                startDate = new Date(customDate);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 1);
                daysToProcess = 1;
            } else if (timeframe === 'week') {
                startDate = new Date(customWeekStart);
                endDate = new Date(customWeekStart);
                endDate.setDate(endDate.getDate() + 7);
                daysToProcess = 7;

                // Find matching week ID for global stats call
                const { data: weekData } = await supabase.from('weeks')
                    .select('id')
                    .eq('start_date', startDate.toISOString().split('T')[0])
                    .limit(1)
                    .maybeSingle();
                if (weekData) weekIdForStats = weekData.id;
            } else {
                // Month: last 30 days
                endDate = new Date();
                endDate.setHours(23, 59, 59, 999);
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
                daysToProcess = 30;
            }

            // 3. Get master KPIs from adminService (Gold Standard for consistency)
            const daysFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            const globalStats = await adminService.getGlobalStats({
                day: timeframe === 'day' ? daysFr[new Date(customDate).getDay()] : 'all',
                weekId: weekIdForStats,
                teacher: filters.teacher,
                className: filters.class,
                subject: filters.subject,
                exactDateStart: startDate.toISOString(),
                exactDateEnd: endDate.toISOString(),
                isLive: true // Explicitly scan logs instead of only counting schedule.status
            });

            // 4. Fetch Attendance Logs for historical charts and details
            let logsQuery = supabase.from('attendance_logs').select(`
                id, status, recorded_at, points, late_minutes,
                schedules:schedules!attendance_logs_schedule_id_fkey (
                    id, teacher_name, class_name, subject, teacher, class
                )
            `).gte('recorded_at', startDate.toISOString())
              .lt('recorded_at', endDate.toISOString());

            const { data: notifData } = await supabase.from('notifications').select('id, read');
            
            const { data: logsData, error: logsError } = await logsQuery;
            if (logsError) throw logsError;

            // 3. Fetch Alerts
            let alertsQuery = supabase.from('alerts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
            
            const { data: alertsData, error: alertsError } = await alertsQuery;
            if (alertsError) throw alertsError;

            // 4. Process Data
            const baseLogs = logsData || [];
            
            // Extract options for filters (from all logs in timeframe, scoped by supervisor if applicable)
            let scopeFiltered = baseLogs.map(log => ({
                ...log,
                schedules: Array.isArray(log.schedules) ? log.schedules[0] : log.schedules
            }));

            if (isSupervisor && scope) {
                scopeFiltered = scopeFiltered.filter(log => {
                    const sched = log.schedules as any;
                    if (!sched) return false;
                    const cName = sched.class_name || sched.class;
                    const sName = sched.subject;
                    return scope!.values.includes(cName) || scope!.values.includes(sName);
                });
            }

            // --- CASCADING OPTIONS LOGIC ---
            // 1. Initial base unique values
            const allTeachers = Array.from(new Set(scopeFiltered.map(l => (l.schedules as any)?.teacher_name || (l.schedules as any)?.teacher))).filter(Boolean).sort() as string[];
            const allSubjects = Array.from(new Set(scopeFiltered.map(l => (l.schedules as any)?.subject))).filter(Boolean).sort() as string[];
            const allClasses = Array.from(new Set(scopeFiltered.map(l => (l.schedules as any)?.class_name || (l.schedules as any)?.class))).filter(Boolean).sort() as string[];

            let teachers = allTeachers;
            let subjects = allSubjects;
            let classes = allClasses;

            // 2. Resolve hierarchical constraints (BI-DIRECTIONAL CASCADNG)
            // Teachers list based on subject/class
            if (filters.subject !== 'all' || filters.class !== 'all') {
                let tLogs = scopeFiltered;
                if (filters.subject !== 'all') tLogs = tLogs.filter(l => (l.schedules as any)?.subject === filters.subject);
                if (filters.class !== 'all') tLogs = tLogs.filter(l => ((l.schedules as any)?.class_name || (l.schedules as any)?.class) === filters.class);
                teachers = Array.from(new Set(tLogs.map(l => (l.schedules as any)?.teacher_name || (l.schedules as any)?.teacher))).filter(Boolean).sort() as string[];
            }
            
            // Subjects list based on teacher/class
            if (filters.teacher !== 'all' || filters.class !== 'all') {
                let sLogs = scopeFiltered;
                if (filters.teacher !== 'all') sLogs = sLogs.filter(l => ((l.schedules as any)?.teacher_name || (l.schedules as any)?.teacher) === filters.teacher);
                if (filters.class !== 'all') sLogs = sLogs.filter(l => ((l.schedules as any)?.class_name || (l.schedules as any)?.class) === filters.class);
                subjects = Array.from(new Set(sLogs.map(l => (l.schedules as any)?.subject))).filter(Boolean).sort() as string[];
            }

            // Classes list based on teacher/subject
            if (filters.teacher !== 'all' || filters.subject !== 'all') {
                let cLogs = scopeFiltered;
                if (filters.teacher !== 'all') cLogs = cLogs.filter(l => ((l.schedules as any)?.teacher_name || (l.schedules as any)?.teacher) === filters.teacher);
                if (filters.subject !== 'all') cLogs = cLogs.filter(l => (l.schedules as any)?.subject === filters.subject);
                classes = Array.from(new Set(cLogs.map(l => (l.schedules as any)?.class_name || (l.schedules as any)?.class))).filter(Boolean).sort() as string[];
            }

            // 5. Final Filtering for Dashboard Metrics
            let filteredLogs = scopeFiltered;

            // Apply UI Filters to the logs that will be used for calculations
            if (filters.teacher !== 'all') {
                filteredLogs = filteredLogs.filter(l => ((l.schedules as any)?.teacher_name || (l.schedules as any)?.teacher) === filters.teacher);
            }
            if (filters.class !== 'all') {
                filteredLogs = filteredLogs.filter(l => ((l.schedules as any)?.class_name || (l.schedules as any)?.class) === filters.class);
            }
            if (filters.subject !== 'all') {
                filteredLogs = filteredLogs.filter(l => (l.schedules as any)?.subject === filters.subject);
            }

            // Advanced metrics calculations
            // Use globalStats for KPIs (expected total vs actual recorded)
            const kpis: StatsKPI = {
                totalSessions: globalStats.total,
                totalPresence: globalStats.present + globalStats.late,
                onTime: globalStats.present,
                late: globalStats.late,
                absent: globalStats.absent,
                totalCriticalAlerts: (alertsData || []).filter(a => a.severity === 'critical').length
            };

            const rates: StatsRates = {
                presenceRate: globalStats.rate,
                lateRate: globalStats.total > 0 ? Math.round((globalStats.late / globalStats.total) * 100) : 0,
                absenceRate: globalStats.total > 0 ? Math.round((globalStats.absent / globalStats.total) * 100) : 0,
            };

            const advNotificationCount = notifData?.length || 0;
            const advUnreadCount = notifData?.filter(n => !n.read).length || 0;

            // Daily Trend (dynamic timeframe)
            const dailyTrend = processDailyTrend(filteredLogs, daysToProcess, timeframe === 'day' ? new Date(customDate) : new Date());

            // Grouped Stats (Class, Teacher, Subject)
            const byClass = processGroupedStats(filteredLogs, 'class_name');
            const byTeacher = processGroupedStats(filteredLogs, 'teacher_name');
            const bySubject = processGroupedStats(filteredLogs, 'subject');

            // Filter Alerts (only by teacher if selected, as alerts aren't tied to class/subject in this table)
            let finalAlerts = (alertsData || []) as AlertRecord[];
            if (filters.teacher !== 'all') {
                finalAlerts = finalAlerts.filter(a => a.professor_name === filters.teacher);
            }

            setState({
                kpis,
                rates,
                recentAlerts: finalAlerts,
                dailyTrend,
                byClass,
                byTeacher,
                bySubject,
                advanced: {
                    avgPoints: 0,
                    avgDelay: 0,
                    totalNotifications: advNotificationCount,
                    unreadNotifications: advUnreadCount,
                },
                options: { teachers, classes, subjects },
                loading: false,
                error: null,
            });

        } catch (err: any) {
            console.error('[useStatistics] Error:', err);
            setState(prev => ({ ...prev, loading: false, error: err.message || 'Error loading statistics' }));
        }
    }, [user, isSupervisor, isAdmin, isSurveillance, timeframe, customDate, customWeekStart, filters]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    return { ...state, timeframe, setTimeframe, customDate, setCustomDate, customWeekStart, goToPrevWeek, goToNextWeek, getMondayOf, filters, setFilters, refetch: fetchStatistics };
};

/**
 * Helper to process daily trend from logs
 */
function processDailyTrend(logs: any[], daysCount: number, referenceDate: Date): DailyTrend[] {
    const days: Record<string, { presence: number, late: number, absence: number }> = {};
    
    for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(referenceDate);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        days[dateStr] = { presence: 0, late: 0, absence: 0 };
    }

    logs.forEach(log => {
        const dateStr = new Date(log.recorded_at).toISOString().split('T')[0];
        if (days[dateStr]) {
            if (log.status === 'present') days[dateStr].presence++;
            else if (log.status === 'late') days[dateStr].late++;
            else if (log.status === 'absent' || log.status === 'absent_justified') days[dateStr].absence++;
        }
    });

    return Object.entries(days).map(([date, stats]) => ({
        date,
        ...stats
    }));
}

/**
 * Helper to process grouped stats (classes or teachers)
 */
function processGroupedStats(logs: any[], key: 'class_name' | 'teacher_name' | 'subject'): GroupedStat[] {
    const groups: Record<string, { onTime: number, late: number, absent: number, total: number }> = {};

    logs.forEach(log => {
        const sched = log.schedules as any;
        if (!sched) return;
        
        // Handle teacher/class field variants from JSON
        const groupName = key === 'class_name' 
            ? (sched.class_name || sched.class || 'Inconnu')
            : key === 'teacher_name'
                ? (sched.teacher_name || sched.teacher || 'Inconnu')
                : (sched.subject || 'Sujet Inconnu');

        if (!groups[groupName]) {
            groups[groupName] = { onTime: 0, late: 0, absent: 0, total: 0 };
        }

        groups[groupName].total++;
        if (log.status === 'present') groups[groupName].onTime++;
        else if (log.status === 'late') groups[groupName].late++;
        else if (log.status === 'absent' || log.status === 'absent_justified') groups[groupName].absent++;
    });

    return Object.entries(groups).map(([name, stats]) => ({
        name,
        ...stats,
        rate: stats.total > 0 ? Math.round(((stats.onTime + stats.late) / stats.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
}
