import { supabase } from './client';

export const adminService = {
  // 1. جلب إحصائيات عامة للوحة التحكم (مع خيارات الفلترة)
  getGlobalStats: async (filters?: { day?: string; weekId?: string }) => {
    let query = supabase.from('schedules').select('status');

    if (filters?.day && filters.day !== 'all') {
      query = query.eq('day', filters.day);
    }

    if (filters?.weekId && filters.weekId !== 'all') {
      query = query.eq('week_id', filters.weekId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const total = data?.length || 0;
    const present = data?.filter(d => d.status === 'present').length || 0;
    const late = data?.filter(d => d.status === 'late').length || 0;
    const absent = data?.filter(d => d.status === 'absent').length || 0;
    const recorded = present + late + absent;

    return {
      total,
      present,
      late,
      absent,
      recorded,
      rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0
    };
  },

  // 1.ب جلب إحصائيات اليوم فقط
  getTodayStats: async () => {
    const daysFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const todayFr = daysFr[new Date().getDay()];

    const { data, error } = await supabase
      .from('schedules')
      .select('status')
      .eq('day', todayFr);

    if (error) throw error;

    const total = data?.length || 0;
    const present = data?.filter(d => d.status === 'present').length || 0;
    const late = data?.filter(d => d.status === 'late').length || 0;
    const absent = data?.filter(d => d.status === 'absent').length || 0;

    return {
      total,
      present,
      late,
      absent,
      rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0
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

  // 4. جلب آخر النشاطات (مع المشرفين المعينين)
  getRecentLogs: async () => {
    // جلب السجلات
    const { data: logsData, error: logsError } = await supabase
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
      .limit(50);

    if (logsError) throw logsError;

    // جلب التعيينات لمعرفة المشرفين المسؤولين
    const { data: assignments, error: assignError } = await supabase
      .from('supervisor_assignments')
      .select(`
        assignment_type,
        assignment_value,
        user:users!supervisor_id(name)
      `);

    if (assignError) throw assignError;

    // تصفية السجلات لتجنب التكرار
    const uniqueLogs: any[] = [];
    const seenSchedules = new Set();

    for (const item of (logsData || [])) {
      const log = item as any;
      if (!seenSchedules.has(log.schedule_id)) {
        // البحث عن المشرفين المعينين لهذا القسم أو المادة (مع معالجة احتمال كون الربط مصفوفة أو كائن)
        const assignedSupervisors = assignments
          ?.filter(a =>
            a.assignment_type === 'all' ||
            (a.assignment_type === 'class' && a.assignment_value === log.schedule?.class) ||
            (a.assignment_type === 'subject' && a.assignment_value === log.schedule?.subject)
          )
          .map((a: any) => {
            const u = a.user;
            return Array.isArray(u) ? u[0]?.name : u?.name;
          })
          .filter(Boolean);

        const recordedUser = log.user;
        const userName = Array.isArray(recordedUser) ? recordedUser[0]?.name : recordedUser?.name;
        const userEmail = Array.isArray(recordedUser) ? recordedUser[0]?.email : recordedUser?.email;

        uniqueLogs.push({
          ...log,
          user_name: userName || userEmail?.split('@')[0] || 'Systeme',
          assigned_supervisors: Array.from(new Set(assignedSupervisors)).join(', ') || 'Non assigné'
        });
        seenSchedules.add(log.schedule_id);
        if (uniqueLogs.length >= 10) break;
      }
    }

    return uniqueLogs;
  },

  // 5. جلب تنبيهات البث المباشر (مع خيارات الفلترة)
  getLiveAlerts: async (filters?: { day?: string; weekId?: string }) => {
    const daysFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const todayFr = daysFr[new Date().getDay()];

    // 1. جلب حصص اليوم المختار (أو تصفية حسب الأسبوع)
    let schedQuery = supabase.from('schedules').select('id');
    
    if (filters?.day && filters.day !== 'all') {
      schedQuery = schedQuery.eq('day', filters.day);
    } else if (!filters?.weekId || filters.weekId === 'all') {
      // إذا لم يتم تحديد يوم ولا أسبوع، نفترض اليوم الحالي فقط للبث المباشر
      schedQuery = schedQuery.eq('day', todayFr);
    }
    
    if (filters?.weekId && filters.weekId !== 'all') {
      schedQuery = schedQuery.eq('week_id', filters.weekId);
    }

    const { data: todaySchedules, error: schedError } = await schedQuery;
    
    if (schedError) throw schedError;
    const scheduleIds = todaySchedules.map(s => s.id);
    if (scheduleIds.length === 0) return [];

    // 2. جلب السجلات لهذه الحصص (حالة غياب أو تأخر فقط)
    const { data: logsData, error: logsError } = await supabase
      .from('attendance_logs')
      .select(`
        id,
        status,
        recorded_at,
        schedule_id,
        schedule:schedules!attendance_logs_schedule_id_fkey(teacher, class, subject),
        user:users!attendance_logs_recorded_by_fkey(name, email)
      `)
      .in('schedule_id', scheduleIds)
      .in('status', ['absent', 'late'])
      .order('recorded_at', { ascending: false });

    if (logsError) throw logsError;

    // 3. جلب التعيينات
    const { data: assignments, error: assignError } = await supabase
      .from('supervisor_assignments')
      .select(`
        assignment_type,
        assignment_value,
        user:users!supervisor_id(name)
      `);

    if (assignError) throw assignError;

    const uniqueLogs: any[] = [];
    const seenSchedules = new Set();

    for (const item of (logsData || [])) {
      const log = item as any;
      if (!seenSchedules.has(log.schedule_id)) {
        const assignedSupervisors = assignments
          ?.filter(a =>
            a.assignment_type === 'all' ||
            (a.assignment_type === 'class' && a.assignment_value === log.schedule?.class) ||
            (a.assignment_type === 'subject' && a.assignment_value === log.schedule?.subject)
          )
          .map((a: any) => {
            const u = a.user;
            return Array.isArray(u) ? u[0]?.name : u?.name;
          })
          .filter(Boolean);

        const recordedUser = log.user;
        const userName = Array.isArray(recordedUser) ? recordedUser[0]?.name : recordedUser?.name;
        const userEmail = Array.isArray(recordedUser) ? recordedUser[0]?.email : recordedUser?.email;

        uniqueLogs.push({
          ...log,
          user_name: userName || userEmail?.split('@')[0] || 'Systeme',
          assigned_supervisors: Array.from(new Set(assignedSupervisors)).join(', ') || 'Non assigné'
        });
        seenSchedules.add(log.schedule_id);
        if (uniqueLogs.length >= 20) break;
      }
    }

    return uniqueLogs;
  },

  // 6. جلب تحليلات الغياب (المناطق الأكثر تضرراً)
  getAbsenceAnalytics: async (filters?: { weekId?: string }) => {
    let query = supabase
      .from('attendance_logs')
      .select(`
        status,
        schedule:schedules!attendance_logs_schedule_id_fkey(teacher, class, week_id)
      `)
      .eq('status', 'absent');

    if (filters?.weekId && filters.weekId !== 'all') {
      // نفلتر حسب الأسبوع من خلال الجدول المرتبط
      query = query.filter('schedule.week_id', 'eq', filters.weekId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const teacherAbsences: Record<string, number> = {};
    const classAbsences: Record<string, number> = {};

    data?.forEach((log: any) => {
      const teacher = log.schedule?.teacher;
      const className = log.schedule?.class;

      if (teacher) {
        teacherAbsences[teacher] = (teacherAbsences[teacher] || 0) + 1;
      }
      if (className) {
        classAbsences[className] = (classAbsences[className] || 0) + 1;
      }
    });

    // تحويل الكائنات إلى مصفوفات مرتبة
    const topTeachers = Object.entries(teacherAbsences)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topClasses = Object.entries(classAbsences)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { topTeachers, topClasses };
  }
};