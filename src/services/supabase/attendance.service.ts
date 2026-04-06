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
    fromDate?: string;
    toDate?: string;
}

// 2. جلب سجلات الحضور مع تفاصيل الأساتذة والفصول
export const getAttendanceLogs = async (filters: LogsFilters = {}): Promise<AttendanceLog[]> => {
    let query = supabase
        .from('attendance_logs')
        .select(`
            id,
            schedule_id,
            status,
            recorded_at,
            schedule:schedules!attendance_logs_schedule_id_fkey(teacher, subject, class),
            user:users!attendance_logs_recorded_by_fkey(name, email)
        `)
        .order('recorded_at', { ascending: false });

    if (filters.fromDate) {
        query = query.gte('recorded_at', filters.fromDate);
    }
    if (filters.toDate) {
        query = query.lte('recorded_at', filters.toDate);
    }

    if (filters.limit) {
        query = query.limit(filters.limit * 5); // زيادة العدد للتصفية محلياً
    }

    const { data, error } = await query;
    if (error) throw error;

    // تصفية السجلات لتجنب تكرار نفس الحصة إذا قام المشرف بالضغط مراراً
    const uniqueLogs: any[] = [];
    const seenSchedules = new Set();
    
    for (const log of (data || [])) {
        if (!seenSchedules.has(log.schedule_id)) {
            uniqueLogs.push(log);
            seenSchedules.add(log.schedule_id);
            if (filters.limit && uniqueLogs.length >= filters.limit) break;
        }
    }

    return uniqueLogs.map((log: any) => ({
        id: log.id,
        schedule_id: log.schedule_id,
        user_id: '', // Not strictly needed
        status: log.status,
        created_at: log.recorded_at,
        teacher_name: log.schedule?.teacher,
        class_name: log.schedule?.class,
        subject: log.schedule?.subject,
        user_name: log.user ? (log.user.name || log.user.email?.split('@')[0] || 'Inconnu') : 'Système Automatique 🤖',
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