import { supabase } from './client';
import { AttendanceLog } from '../../types';

export const createAttendanceLog = async (scheduleId: string, userId: string, status: 'present' | 'absent') => {
    const { data, error } = await supabase
        .from('attendance_logs')
        .insert([{
            schedule_id: scheduleId,
            user_id: userId,
            status
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export interface LogsFilters {
    limit?: number;
    weekId?: string;
    supervisorId?: string;
}

export const getAttendanceLogs = async (filters: LogsFilters = {}): Promise<AttendanceLog[]> => {
    let query = supabase
        .from('attendance_logs')
        .select(`
      id,
      status,
      created_at,
      schedule:schedules!attendance_logs_schedule_id_fkey(teacher_name, subject, class_name),
      user:users!attendance_logs_user_id_fkey(email)
    `)
        .order('created_at', { ascending: false });

    if (filters.limit) {
        query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((log: any) => ({
        id: log.id,
        schedule_id: '', // typically omitted in this specific join, but part of TS interface
        user_id: '',
        status: log.status,
        created_at: log.created_at,
        teacher_name: log.schedule?.teacher_name,
        subject: log.schedule?.subject,
        user_name: log.user?.email ? log.user.email.split('@')[0] : 'مجهول',
    }));
};

export const getAttendanceStats = async () => {
    return {};
};
