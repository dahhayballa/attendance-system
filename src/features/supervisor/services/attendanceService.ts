import { supabase } from '../../../services/supabase/client';
import type { Attendance, Schedule, FilterOptions } from '../types';

/**
 * Récupérer les emplois du temps avec filtres optionnels
 */
export const getSchedules = async (filters?: Partial<FilterOptions>): Promise<Schedule[]> => {
    let query = supabase
        .from('schedules')
        .select('*')
        .order('day', { ascending: true })
        .order('time_start', { ascending: true });

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
    notes?: string
): Promise<Attendance> => {
    const { data, error } = await supabase
        .from('attendance_logs')
        .insert([{
            schedule_id: scheduleId,
            recorded_by: userId,
            status,
            reason: notes ?? null,
            recorded_at: new Date().toISOString(),
        }])
        .select()
        .single();

    if (error) throw error;
    return data as Attendance;
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
export const getTodayStats = async () => {
    const { data, error } = await supabase
        .from('schedules')
        .select('status');

    if (error) throw error;

    const total = data.length;
    const completed = data.filter(d => d.status === 'completed').length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, rate };
};
