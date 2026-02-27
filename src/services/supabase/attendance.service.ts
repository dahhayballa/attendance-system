import { supabase } from './client';
import { AttendanceLog } from '../../types';

export const createAttendanceLog = async (scheduleId: string, userId: string, status: 'present' | 'absent') => {
    const { data, error } = await supabase
        .from('attendance_logs')
        .insert([{
            schedule_id: scheduleId,
            recorded_by: userId,
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
      recorded_at,
      schedule:schedules!attendance_logs_schedule_id_fkey(teacher, subject, class),
      user:users!attendance_logs_recorded_by_fkey(email)
    `)
        .order('recorded_at', { ascending: false });

    if (filters.limit) {
        query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((log: any) => ({
        id: log.id,
        schedule_id: '',
        user_id: '',
        status: log.status,
        created_at: log.recorded_at,
        teacher_name: log.schedule?.teacher,
        subject: log.schedule?.subject,
        user_name: log.user?.email ? log.user.email.split('@')[0] : 'مجهول',
    }));
};

export const getAttendanceStats = async () => {
    return {};
};
