import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../services/supabase/client';
import { useAuth } from '../../auth/hooks/useAuth';
import { useActiveWeek } from '../../../shared/hooks/useActiveWeek';
import type { Schedule } from '../types';

interface CurrentSessionState {
    currentSession: Schedule | null;
    nextSession: Schedule | null;
    allCurrentSessions: Schedule[];
    timeRemaining: number;
    progress: number;
    loading: boolean;
    error: string | null;
}

const SCHOOL_TIMEZONE = 'Africa/Nouakchott';

const getSchoolDayName = (): string => {
    const enDay = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        timeZone: SCHOOL_TIMEZONE,
    }).format(new Date());

    const map: Record<string, string> = {
        Sunday: 'Dimanche',
        Monday: 'Lundi',
        Tuesday: 'Mardi',
        Wednesday: 'Mercredi',
        Thursday: 'Jeudi',
        Friday: 'Vendredi',
        Saturday: 'Samedi',
    };

    return map[enDay] || 'Lundi';
};

const getSchoolCurrentMinutes = (): number => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: SCHOOL_TIMEZONE,
    }).formatToParts(new Date());

    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    return hour * 60 + minute;
};

const normalizeText = (value?: string | null): string =>
    (value || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

const normalizeDay = (value: string): string => {
    const v = (value || '')
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const map: Record<string, string> = {
        dimanche: 'dimanche',
        sunday: 'dimanche',
        'الاحد': 'dimanche',
        'الأحد': 'dimanche',
        lundi: 'lundi',
        monday: 'lundi',
        'الاثنين': 'lundi',
        'الإثنين': 'lundi',
        mardi: 'mardi',
        tuesday: 'mardi',
        'الثلاثاء': 'mardi',
        mercredi: 'mercredi',
        wednesday: 'mercredi',
        'الاربعاء': 'mercredi',
        'الأربعاء': 'mercredi',
        jeudi: 'jeudi',
        thursday: 'jeudi',
        'الخميس': 'jeudi',
        vendredi: 'vendredi',
        friday: 'vendredi',
        'الجمعة': 'vendredi',
        samedi: 'samedi',
        saturday: 'samedi',
        'السبت': 'samedi',
    };

    return map[v] ?? v;
};

export const useCurrentSession = () => {
    const { user } = useAuth();
    const { activeWeek } = useActiveWeek();
    const [state, setState] = useState<CurrentSessionState>({
        currentSession: null,
        nextSession: null,
        allCurrentSessions: [],
        timeRemaining: 0,
        progress: 0,
        loading: true,
        error: null,
    });
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastNonEmptyRowsRef = useRef<Schedule[]>([]);

    const timeToMinutes = (time: string): number => {
        const parts = time.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    };

    const processSchedules = useCallback((schedules: Schedule[]) => {
        const currentMinutes = getSchoolCurrentMinutes();

        const current = schedules.filter(s => {
            const start = timeToMinutes(s.time_start);
            const end   = timeToMinutes(s.time_end);
            return currentMinutes >= start && currentMinutes < end;
        });

        const upcoming = schedules
            .filter(s => timeToMinutes(s.time_start) > currentMinutes)
            .sort((a, b) => timeToMinutes(a.time_start) - timeToMinutes(b.time_start));

        const mainSession = current[0] || null;
        let timeRemaining = 0;
        let progress = 0;

        if (mainSession) {
            const start = timeToMinutes(mainSession.time_start);
            const end   = timeToMinutes(mainSession.time_end);
            const total = end - start;
            const elapsed = currentMinutes - start;
            timeRemaining = end - currentMinutes;
            progress = total > 0 ? Math.round((elapsed / total) * 100) : 0;
        }

        setState(prev => ({
            ...prev,
            currentSession: mainSession,
            nextSession: upcoming[0] || null,
            allCurrentSessions: current,
            timeRemaining,
            progress,
            loading: false,
            error: null,
        }));
    }, []);

    const keepOnlyRelevantRows = useCallback((rows: Schedule[]) => {
        const now = getSchoolCurrentMinutes();
        return rows.filter(s => timeToMinutes(s.time_end) >= now - 5);
    }, []);

    const fetchSchedules = useCallback(async () => {
        try {
            const todayName = getSchoolDayName();
            const todayNormalized = normalizeDay(todayName);

            let query = supabase
                .from('schedules')
                .select('*')
                .order('time_start', { ascending: true });

            if (activeWeek?.id) {
                query = query.eq('week_id', activeWeek.id);
            }

            const { data, error } = await query;
            if (error) throw error;
            const allRows = (data as Schedule[]) || [];

            const todayRows = allRows.filter(s => normalizeDay(s.day) === todayNormalized);

            // Apply pointer filtering when possible, but never hide all sessions because of minor name mismatches.
            let scopedRows = todayRows;
            if ((user?.role === 'supervisor' || user?.role === 'surveillance') && user?.name) {
                const userName = normalizeText(user.name);
                const byPointer = todayRows.filter(s => normalizeText((s as any).pointer) === userName);
                if (byPointer.length > 0) {
                    scopedRows = byPointer;
                }
            }

            let rowsToProcess = scopedRows;
            if (rowsToProcess.length > 0) {
                lastNonEmptyRowsRef.current = rowsToProcess;
            } else if (lastNonEmptyRowsRef.current.length > 0) {
                // Temporary fallback to avoid UI drops on transient empty fetches.
                const fallbackRows = keepOnlyRelevantRows(lastNonEmptyRowsRef.current);
                if (fallbackRows.length > 0) {
                    rowsToProcess = fallbackRows;
                }
            }

            processSchedules(rowsToProcess);
        } catch (err: any) {
            console.error('[useCurrentSession] Erreur:', err);
            setState(prev => ({ ...prev, loading: false, error: 'Erreur de chargement' }));
        }
    }, [processSchedules, user?.role, user?.name, activeWeek?.id]);

    useEffect(() => {
        fetchSchedules();
        intervalRef.current = setInterval(fetchSchedules, 60_000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchSchedules]);

    useEffect(() => {
        const channel = supabase
            .channel('attendance_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, fetchSchedules)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchSchedules]);

    return {
        ...state,
        refetch: fetchSchedules,
        hasMultipleTeachers: state.allCurrentSessions.length > 1,
    };
};