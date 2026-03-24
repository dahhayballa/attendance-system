import { supabase } from './client';

export const adminService = {
  // 1. جلب إحصائيات عامة للوحة التحكم
  getGlobalStats: async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('status');

    if (error) throw error;

    const total = data?.length || 0;
    const present = data?.filter(d => d.status === 'present').length || 0;
    const absent = data?.filter(d => d.status === 'absent').length || 0;

    return {
      total,
      present,
      absent,
      rate: total > 0 ? Math.round((present / total) * 100) : 0
    };
  },

  // 2. جلب قائمة الأسابيع مع عدد الحصص في كل أسبوع
  getWeeksWithCounts: async () => {
    const { data, error } = await supabase
      .from('weeks')
      .select(`
        id,
        name,
        start_date,
        schedules(count)
      `)
      .order('start_date', { ascending: false });

    if (error) throw error;
    
    return data.map(week => ({
      ...week,
      // نضمن بقاء الصيغة متوافقة مع واجهة المستخدم
      schedules: week.schedules || [{ count: 0 }]
    }));
  },

  // 3. حذف أسبوع وكل ما يتعلق به (Cascade Delete)
  deleteWeek: async (weekId: string) => {
    const { error } = await supabase
      .from('weeks')
      .delete()
      .eq('id', weekId);

    if (error) throw error;
    return true;
  },

  // 4. جلب آخر النشاطات (خالية من التكرار لنفس الحصة)
  getRecentLogs: async () => {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        id,
        status,
        recorded_at,
        schedule_id,
        schedule:schedules!attendance_logs_schedule_id_fkey(teacher, class, subject),
        user:users!attendance_logs_recorded_by_fkey(name, email)
      `)
      .order('recorded_at', { ascending: false })
      .limit(50); // نجلب بزيادة ثم نصفيها

    if (error) throw error;
    
    // تصفية السجلات لتجنب التكرار (عرض أحدث حالة فقط لكل حصة)
    const uniqueLogs: any[] = [];
    const seenSchedules = new Set();
    
    for (const item of (data || [])) {
        const log = item as any;
        if (!seenSchedules.has(log.schedule_id)) {
            uniqueLogs.push({
                ...log,
                user_name: log.user?.name || log.user?.email?.split('@')[0] || 'Inconnu'
            });
            seenSchedules.add(log.schedule_id);
            if (uniqueLogs.length >= 10) break; // نريد فقط آخر 10 فريدة
        }
    }

    return uniqueLogs;
  }
};