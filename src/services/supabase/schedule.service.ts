import { supabase } from './client';
import { Schedule, ScheduleStats, SuspensionFilters } from '../../types';

export const searchSchedulesByTeacher = async (teacherName: string): Promise<Schedule[]> => {
    const { data, error } = await supabase
        .from('schedules')
        .select(`
      *,
      recorded_by_user:users!schedules_recorded_by_fkey(id, email, role)
    `)
        .ilike('teacher', `%${teacherName}%`)
        .order('day', { ascending: true })
        .order('time_start', { ascending: true });

    if (error) throw error;
    return data as Schedule[];
};

export const updateScheduleStatus = async (scheduleId: string, status: 'present' | 'absent', userId: string): Promise<Schedule> => {
    const { data, error } = await supabase
        .from('schedules')
        .update({
            status,
            recorded_by: userId,
            recorded_at: new Date().toISOString()
        })
        .eq('id', scheduleId)
        .select()
        .single();

    if (error) throw error;

    // Supprimer l'ancien pointage pour cette séance, puis insérer le nouveau
    await supabase.from('attendance_logs').delete().eq('schedule_id', scheduleId);
    await supabase.from('attendance_logs').insert({
        schedule_id: scheduleId,
        recorded_by: userId,
        status,
        recorded_at: new Date().toISOString(),
        session_date: new Date().toISOString().split('T')[0],
    });

    return data as Schedule;
};

export const getSchedulesByWeek = async (weekId: string): Promise<Schedule[]> => {
    const { data, error } = await supabase
        .from('schedules')
        .select(`
      *,
      recorded_by_user:users!schedules_recorded_by_fkey(id, email)
    `)
        .eq('week_id', weekId)
        .order('day', { ascending: true })
        .order('time_start', { ascending: true });

    if (error) throw error;
    return data as Schedule[];
};

export const getScheduleStats = async (): Promise<ScheduleStats> => {
    const { data, error } = await supabase
        .from('schedules')
        .select('status');

    if (error) throw error;

    const total = data.length;
    const present = data.filter(d => d.status === 'present').length;
    const absent = data.filter(d => d.status === 'absent').length;
    const recorded = present + absent;
    const pending = total - recorded;

    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, recorded, pending, rate };
};

export const bulkInsertSchedules = async (schedules: Partial<Schedule>[]): Promise<Schedule[]> => {
    const { data, error } = await supabase
        .from('schedules')
        .insert(schedules)
        .select();

    if (error) throw error;
    return data as Schedule[];
};

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULE MANAGEMENT (Admin)
// ─────────────────────────────────────────────────────────────────────────────

/** Update editable fields of a single schedule (teacher, subject, room, times) */
export const updateScheduleDetails = async (
    scheduleId: string,
    updates: {
        teacher?: string;
        subject?: string;
        time_start?: string;
        time_end?: string;
        room?: string;
    }
): Promise<Schedule> => {
    const { data, error } = await supabase
        .from('schedules')
        .update(updates)
        .eq('id', scheduleId)
        .select()
        .single();
    if (error) throw error;
    return data as Schedule;
};

/** Cancel a single schedule entry */
export const cancelSchedule = async (
    scheduleId: string,
    reason: string,
    cancelledBy: string
): Promise<Schedule> => {
    const { data, error } = await supabase
        .from('schedules')
        .update({
            status: 'cancelled',
            cancellation_reason: reason,
            cancelled_by: cancelledBy,
            cancelled_at: new Date().toISOString(),
        })
        .eq('id', scheduleId)
        .select()
        .single();
    if (error) throw error;
    return data as Schedule;
};

/** Restore a previously cancelled schedule back to 'pending' */
export const restoreSchedule = async (scheduleId: string): Promise<Schedule> => {
    const { data, error } = await supabase
        .from('schedules')
        .update({
            status: 'pending',
            cancellation_reason: null,
            cancelled_by: null,
            cancelled_at: null,
        })
        .eq('id', scheduleId)
        .select()
        .single();
    if (error) throw error;
    return data as Schedule;
};

/**
 * Bulk cancel all PENDING schedules matching the given filters.
 * If filters.day is empty → entire week is affected.
 * If filters.class is empty → all classes are affected.
 * Returns the count of cancelled rows.
 */
export const bulkCancelSchedules = async (
    filters: SuspensionFilters,
    cancelledBy: string
): Promise<{ count: number }> => {
    let query = supabase
        .from('schedules')
        .update({
            status: 'cancelled',
            cancellation_reason: filters.reason,
            cancelled_by: cancelledBy,
            cancelled_at: new Date().toISOString(),
        })
        .eq('week_id', filters.week_id)
        .eq('status', 'pending'); // only cancel sessions not yet recorded

    if (filters.day) {
        query = (query as any).eq('day', filters.day);
    }
    if (filters.class) {
        query = (query as any).eq('class', filters.class);
    }

    const { data, error } = await (query as any).select('id');
    if (error) throw error;
    return { count: (data as any[])?.length ?? 0 };
};

/** Fetch all cancelled schedules for a given week, optionally filtered by day/class */
export const getCancelledSchedules = async (
    weekId: string,
    day?: string,
    className?: string
): Promise<Schedule[]> => {
    let query = supabase
        .from('schedules')
        .select('*')
        .eq('week_id', weekId)
        .eq('status', 'cancelled')
        .order('day', { ascending: true })
        .order('time_start', { ascending: true });

    if (day) query = (query as any).eq('day', day);
    if (className) query = (query as any).eq('class', className);

    const { data, error } = await query;
    if (error) throw error;
    return data as Schedule[];
};
