import { supabase } from './client';
import { Schedule, ScheduleStats } from '../../types';

export const searchSchedulesByTeacher = async (teacherName: string): Promise<Schedule[]> => {
    const { data, error } = await supabase
        .from('schedules')
        .select(`
      *,
      recorded_by_user:users!schedules_recorded_by_fkey(id, email, role)
    `)
        .ilike('teacher_name', `%${teacherName}%`)
        .order('day_name', { ascending: true })
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
        .order('day_name', { ascending: true })
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
