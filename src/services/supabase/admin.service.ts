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

  // 4. جلب آخر النشاطات (هذا هو الجزء الذي كان ينقصك)
  getRecentLogs: async () => {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        id,
        status,
        recorded_at,
        schedule:schedules(teacher, class, subject)
      `)
      .order('recorded_at', { ascending: false })
      .limit(10); // سنجلب آخر 10 عمليات

    if (error) throw error;
    return data || [];
  }
};