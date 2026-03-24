import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../services/supabase/client';
import type { Schedule } from '../types';

interface CurrentSessionState {
    currentSession: Schedule | null;
    nextSession: Schedule | null;
    allCurrentSessions: Schedule[]; // Quand plusieurs profs au même créneau
    timeRemaining: number; // en minutes
    progress: number; // 0-100
    loading: boolean;
    error: string | null;
}

/**
 * Hook qui détermine la session en cours en comparant l'heure actuelle
 * aux créneaux du jour. Se rafraîchit automatiquement chaque minute.
 */
export const useCurrentSession = () => {
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

    // Jour actuel en arabe pour matcher la colonne `day`
    const getTodayName = (): string => {
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return days[new Date().getDay()];
    };

    // Convertir "HH:MM" en minutes depuis minuit
    const timeToMinutes = (time: string): number => {
        const parts = time.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    };

    const processSchedules = useCallback((schedules: Schedule[]) => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Sessions en cours (heure actuelle entre time_start et time_end)
        const current = schedules.filter(s => {
            const start = timeToMinutes(s.time_start);
            const end = timeToMinutes(s.time_end);
            return currentMinutes >= start && currentMinutes < end;
        });

        // Prochaine session (la plus proche dans le futur)
        const upcoming = schedules
            .filter(s => timeToMinutes(s.time_start) > currentMinutes)
            .sort((a, b) => timeToMinutes(a.time_start) - timeToMinutes(b.time_start));

        const mainSession = current[0] || null;
        let timeRemaining = 0;
        let progress = 0;

        if (mainSession) {
            const start = timeToMinutes(mainSession.time_start);
            const end = timeToMinutes(mainSession.time_end);
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

    const fetchSchedules = useCallback(async () => {
        try {
            const todayName = getTodayName();
            const { data, error } = await supabase
                .from('schedules')
                .select('*')
                .eq('day', todayName)
                .order('time_start', { ascending: true });

            if (error) throw error;
            processSchedules(data as Schedule[]);
        } catch (err: any) {
            console.error('[useCurrentSession] Erreur:', err);
            setState(prev => ({ ...prev, loading: false, error: 'فشل في تحميل الحصص' }));
        }
    }, [processSchedules]);

    // Fetch initial + refresh chaque minute
    useEffect(() => {
        fetchSchedules();

        intervalRef.current = setInterval(() => {
            fetchSchedules();
        }, 60_000); // Chaque minute

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchSchedules]);

    // Supabase realtime : écouter les changements sur attendance_logs
    useEffect(() => {
        const channel = supabase
            .channel('attendance_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attendance_logs' },
                () => {
                    // Refetch quand un enregistrement change
                    fetchSchedules();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchSchedules]);

    return {
        ...state,
        refetch: fetchSchedules,
        hasMultipleTeachers: state.allCurrentSessions.length > 1,
    };
};
