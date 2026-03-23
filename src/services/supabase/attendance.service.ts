import { supabase } from './client';
import { AttendanceLog } from '../../types';

// 1. تسجيل عملية حضور/غياب جديدة
export const createAttendanceLog = async (scheduleId: string, userId: string, status: 'present' | 'absent') => {
    // تحديث حالة الحصة في جدول الجداول أولاً
    const { error: updateError } = await supabase
        .from('schedules')
        .update({ status })
        .eq('id', scheduleId);

    if (updateError) throw updateError;

    // ثم تسجيل اللوج في جدول السجلات
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

// 2. جلب سجلات الحضور مع تفاصيل الأساتذة والفصول
export const getAttendanceLogs = async (filters: LogsFilters = {}): Promise<AttendanceLog[]> => {
    let query = supabase
        .from('attendance_logs')
        .select(`
            id,
            status,
            recorded_at,
            schedule:schedules!attendance_logs_schedule_id_fkey(teacher, subject, class),
            user:profiles!attendance_logs_recorded_by_fkey(full_name, email)
        `) // ملاحظة: غيرت اسم الجدول من users إلى profiles لأنه الغالب في Supabase
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
        class_name: log.schedule?.class, // أضفنا الفصل هنا
        subject: log.schedule?.subject,
        user_name: log.user?.full_name || log.user?.email?.split('@')[0] || 'مجهول',
    }));
};

// 3. حساب الإحصائيات الحقيقية (STATS)
export const getAttendanceStats = async () => {
    // جلب عدد الحصص الكلي والغياب والحضور
    const { data, error } = await supabase
        .from('attendance_logs')
        .select('status');

    if (error) throw error;

    const total = data.length;
    const present = data.filter(d => d.status === 'present').length;
    const absent = data.filter(d => d.status === 'absent').length;
    
    // حساب النسبة المئوية
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
        totalSchedules: total,
        presentCount: present,
        absentCount: absent,
        attendanceRate: `${attendanceRate}%`
    };
};