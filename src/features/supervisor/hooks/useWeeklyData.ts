import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';

/* ═══════════ Types ═══════════ */

export interface CalendarCell {
    day: string;
    timeSlot: string;
    schedule: {
        id: string;
        class: string;
        subject: string;
        teacher: string;
        room: string;
        time_start: string;
        time_end: string;
    } | null;
    attendance: {
        status: 'present' | 'absent' | 'late' | 'excused' | null;
        lateMinutes?: number;
        notes?: string;
        recorded_at?: string;
    } | null;
}

export interface WeeklyData {
    cells: CalendarCell[];
    days: string[];
    timeSlots: string[];
    loading: boolean;
    error: string | null;
}

const DAYS_ORDER = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/**
 * Hook pour récupérer toutes les données d'une semaine
 * et les organiser en grille jour×créneau.
 */
export const useWeeklyData = (weekOffset: number = 0): WeeklyData & { refetch: () => void } => {
    const [state, setState] = useState<WeeklyData>({
        cells: [],
        days: [],
        timeSlots: [],
        loading: true,
        error: null,
    });

    const fetchWeekData = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            // Récupérer tous les schedules
            const { data, error } = await supabase
                .from('schedules')
                .select('*')
                .order('time_start', { ascending: true });

            if (error) throw error;
            if (!data) return;

            // Extraire les jours et créneaux uniques
            const daySet = new Set<string>();
            const slotSet = new Set<string>();

            data.forEach((s: any) => {
                if (s.day) daySet.add(s.day);
                if (s.time_start && s.time_end) {
                    slotSet.add(`${s.time_start}-${s.time_end}`);
                }
            });

            // Trier les jours selon l'ordre arabe
            const days = Array.from(daySet).sort(
                (a, b) => DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b)
            );

            // Trier les créneaux chronologiquement
            const timeSlots = Array.from(slotSet).sort((a, b) => {
                const aStart = a.split('-')[0];
                const bStart = b.split('-')[0];
                return aStart.localeCompare(bStart);
            });

            // Construire la grille
            const cells: CalendarCell[] = [];

            for (const day of days) {
                for (const slot of timeSlots) {
                    const [slotStart, slotEnd] = slot.split('-');
                    const match = data.find((s: any) =>
                        s.day === day && s.time_start === slotStart && s.time_end === slotEnd
                    );

                    cells.push({
                        day,
                        timeSlot: slot,
                        schedule: match ? {
                            id: match.id,
                            class: match.class || '',
                            subject: match.subject || '',
                            teacher: match.teacher || '',
                            room: match.room || '',
                            time_start: match.time_start,
                            time_end: match.time_end,
                        } : null,
                        attendance: match ? {
                            status: match.status === 'pending' || !match.status ? null :
                                (match.status === 'completed' ? 'present' : match.status),
                            recorded_at: match.recorded_at,
                        } : null,
                    });
                }
            }

            setState({ cells, days, timeSlots, loading: false, error: null });
        } catch (err: any) {
            console.error('[useWeeklyData] Erreur:', err);
            setState(prev => ({ ...prev, loading: false, error: 'فشل في تحميل بيانات الأسبوع' }));
        }
    }, [weekOffset]);

    useEffect(() => {
        fetchWeekData();
    }, [fetchWeekData]);

    return { ...state, refetch: fetchWeekData };
};

/**
 * Hook pour la navigation entre semaines
 */
export const useCalendarNavigation = () => {
    const [weekOffset, setWeekOffset] = useState(0);

    const goToPreviousWeek = () => setWeekOffset(w => w - 1);
    const goToNextWeek = () => setWeekOffset(w => w + 1);
    const goToCurrentWeek = () => setWeekOffset(0);

    // Calculer les dates de la semaine
    const getWeekDates = () => {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek + (weekOffset * 7));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        return {
            start: startOfWeek,
            end: endOfWeek,
            label: `${startOfWeek.toLocaleDateString('ar-MR', { day: 'numeric', month: 'long' })} — ${endOfWeek.toLocaleDateString('ar-MR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        };
    };

    return {
        weekOffset,
        weekDates: getWeekDates(),
        goToPreviousWeek,
        goToNextWeek,
        goToCurrentWeek,
        isCurrentWeek: weekOffset === 0,
    };
};
