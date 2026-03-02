import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';

/* ═══════════ Types ═══════════ */

export interface TeacherClassInfo {
    time: string;
    class: string;
    subject: string;
    room: string;
    status: string | null;
    schedule_id: string;
}

export interface TeacherStatus {
    teacher: string;
    status: 'present' | 'absent' | 'late' | 'excused' | 'pending';
    currentClass?: TeacherClassInfo;
    nextClass?: TeacherClassInfo;
    allClasses: TeacherClassInfo[];
}

/**
 * Hook qui récupère les emplois du temps d'aujourd'hui
 * et agrège par enseignant avec statut courant.
 */
export const useTeacherStatus = () => {
    const [teachers, setTeachers] = useState<TeacherStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const todayName = (): string => {
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        return days[new Date().getDay()];
    };

    const timeToMinutes = (t: string): number => {
        const p = t.split(':');
        return parseInt(p[0]) * 60 + parseInt(p[1]);
    };

    const fetchTeachers = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error: err } = await supabase
                .from('schedules')
                .select('*')
                .eq('day', todayName())
                .order('time_start', { ascending: true });

            if (err) throw err;
            if (!data) return;

            const now = new Date();
            const currentMin = now.getHours() * 60 + now.getMinutes();

            // Grouper par enseignant
            const map = new Map<string, TeacherClassInfo[]>();
            data.forEach((s: any) => {
                if (!s.teacher) return;
                const list = map.get(s.teacher) || [];
                list.push({
                    time: s.time_start,
                    class: s.class || '',
                    subject: s.subject || '',
                    room: s.room || '',
                    status: s.status === 'pending' || !s.status ? null :
                        (s.status === 'completed' ? 'present' : s.status),
                    schedule_id: s.id,
                });
                map.set(s.teacher, list);
            });

            const result: TeacherStatus[] = Array.from(map.entries()).map(([teacher, classes]) => {
                // Déterminer la classe en cours / prochaine
                const current = classes.find(c => {
                    const start = timeToMinutes(c.time);
                    // Estimer fin = start + 60 min (ou utiliser les données)
                    const matchFull = data.find((s: any) => s.id === c.schedule_id);
                    const end = matchFull?.time_end ? timeToMinutes(matchFull.time_end) : start + 60;
                    return currentMin >= start && currentMin < end;
                });

                const next = classes.find(c => timeToMinutes(c.time) > currentMin);

                // Déterminer le statut global
                let overallStatus: TeacherStatus['status'] = 'pending';
                if (current?.status) {
                    overallStatus = current.status as TeacherStatus['status'];
                } else {
                    // Vérifier les statuts passés
                    const pastClasses = classes.filter(c => timeToMinutes(c.time) <= currentMin);
                    const hasAbsent = pastClasses.some(c => c.status === 'absent');
                    const hasLate = pastClasses.some(c => c.status === 'late');
                    const allPresent = pastClasses.length > 0 && pastClasses.every(c => c.status === 'present');

                    if (hasAbsent) overallStatus = 'absent';
                    else if (hasLate) overallStatus = 'late';
                    else if (allPresent) overallStatus = 'present';
                }

                return {
                    teacher,
                    status: overallStatus,
                    currentClass: current,
                    nextClass: next,
                    allClasses: classes,
                };
            });

            // Trier : pending d'abord, puis absent, late, present
            const order: Record<string, number> = { pending: 0, absent: 1, late: 2, excused: 3, present: 4 };
            result.sort((a, b) => (order[a.status] ?? 5) - (order[b.status] ?? 5));

            setTeachers(result);
            setError(null);
        } catch (err: any) {
            console.error('[useTeacherStatus] Erreur:', err);
            setError('فشل في تحميل قائمة الأساتذة');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

    // Realtime
    useEffect(() => {
        const ch = supabase
            .channel('teacher_status_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => fetchTeachers())
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [fetchTeachers]);

    return { teachers, loading, error, refetch: fetchTeachers };
};
