import { supabase } from '../../../services/supabase/client';
import type { Attendance, Schedule, FilterOptions } from '../types';

/**
 * Récupérer les emplois du temps avec filtres optionnels
 */
export const getSchedules = async (filters?: Partial<FilterOptions>, weekId?: string): Promise<Schedule[]> => {
    let query = supabase
        .from('schedules')
        .select('*')
        .order('day', { ascending: true })
        .order('time_start', { ascending: true });

    if (weekId) query = query.eq('week_id', weekId);
    if (filters?.day) query = query.eq('day', filters.day);
    if (filters?.class) query = query.eq('class', filters.class);
    if (filters?.teacher) query = query.ilike('teacher', `%${filters.teacher}%`);
    if (filters?.subject) query = query.eq('subject', filters.subject);
    if (filters?.room) query = query.eq('room', filters.room);

    const { data, error } = await query;
    if (error) throw error;
    return data as Schedule[];
};

/**
 * Enregistrer une présence
 */
export const recordAttendance = async (
    scheduleId: string,
    status: Attendance['status'],
    userId: string,
    notes?: string,
    sessionDate?: string
): Promise<Attendance> => {
    const { data, error } = await supabase
        .from('attendance_logs')
        .insert([{
            schedule_id: scheduleId,
            recorded_by: userId,
            status,
            reason: notes ?? null,
            recorded_at: new Date().toISOString(),
            session_date: sessionDate ?? new Date().toISOString().split('T')[0],
        }])
        .select()
        .single();

    if (error) throw error;

    // تحديث status في schedules
    await supabase
        .from('schedules')
        .update({
            status,
            recorded_by: userId,
            recorded_at: new Date().toISOString(),
        })
        .eq('id', scheduleId);

    return data as Attendance;
};

/**
 * Marquer automatiquement absent les séances terminées non pointées.
 * Cette fonction ne touche que les séances encore en "pending".
 */
export const autoMarkEndedSessionsAbsent = async (
    schedules: Schedule[],
    currentMinutes: number
): Promise<number> => {
    const toMarkAbsent = schedules.filter(s => {
        const status = (s.status || 'pending').toString().toLowerCase();
        if (status !== 'pending') return false;
        const [eh, em] = (s.time_end || '00:00').split(':').map(Number);
        const endMinutes = eh * 60 + em;
        return currentMinutes >= endMinutes;
    });

    if (toMarkAbsent.length === 0) return 0;

    const nowIso = new Date().toISOString();
    const ids = toMarkAbsent.map(s => s.id);

    const { error: updateError } = await supabase
        .from('schedules')
        .update({
            status: 'absent',
            recorded_by: null,
            recorded_at: nowIso,
        })
        .in('id', ids);

    if (updateError) throw updateError;

    const logs = ids.map(id => ({
        schedule_id: id,
        recorded_by: null,
        status: 'absent' as const,
        recorded_at: nowIso,
        reason: 'Absence automatique: séance terminée sans pointage',
    }));

    const { error: logsError } = await supabase
        .from('attendance_logs')
        .insert(logs);

    if (logsError) throw logsError;

    return ids.length;
};

/**
 * Récupérer les logs de présence récents
 */
export const getRecentAttendance = async (limit = 20): Promise<Attendance[]> => {
    const { data, error } = await supabase
        .from('attendance_logs')
        .select(`
            id,
            schedule_id,
            status,
            recorded_by,
            recorded_at
        `)
        .order('recorded_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data as Attendance[];
};

/**
 * Statistiques rapides de la journée
 */
export const getTodayStats = async (weekId?: string) => {
    const days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    const today = days[new Date().getDay()];

    let query = supabase
        .from('schedules')
        .select('status')
        .eq('day', today);

    if (weekId) {
        query = query.eq('week_id', weekId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const total    = data.length;
    const present  = data.filter(d => d.status === 'present').length;
    const absent   = data.filter(d => d.status === 'absent').length;
    const recorded = present + absent;
    const pending  = total - recorded;
    const rate     = total > 0 ? Math.round((recorded / total) * 100) : 0;

    return { total, present, absent, pending, rate };
};
