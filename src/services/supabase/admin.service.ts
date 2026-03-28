import { supabase } from './client';

export const adminService = {
  // 0. جلب خيارات الفلترة (الأساتذة، الأقسام، والمواد)
  getFiltersOptions: async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('teacher, class, subject');
      
    if (error) throw error;
    
    const classes = Array.from(new Set((data || []).map(s => s.class).filter(Boolean))).sort() as string[];

    const teacherSubjectPairs = new Set<string>();
    const subjectTeacherPairs = new Set<string>();

    (data || []).forEach(s => {
      if (s.teacher && s.subject) {
        teacherSubjectPairs.add(`${s.teacher}|${s.subject}`);
        subjectTeacherPairs.add(`${s.subject}|${s.teacher}`);
      } else if (s.teacher) {
        teacherSubjectPairs.add(`${s.teacher}|`);
      } else if (s.subject) {
        subjectTeacherPairs.add(`${s.subject}|`);
      }
    });

    const teachers = Array.from(teacherSubjectPairs).map(pair => {
      const [teacher, subject] = pair.split('|');
      return {
        value: pair,
        label: subject ? `${teacher} (${subject})` : teacher
      };
    }).sort((a, b) => {
      if (a.label === b.label) return 0;
      return a.label > b.label ? 1 : -1;
    });

    const subjects = Array.from(subjectTeacherPairs).map(pair => {
      const [subject, teacher] = pair.split('|');
      return {
        value: pair,
        label: teacher ? `${subject} (${teacher})` : subject
      };
    }).sort((a, b) => {
      if (a.label === b.label) return 0;
      return a.label > b.label ? 1 : -1;
    });
    
    return { teachers, classes, subjects };
  },

  // 1. جلب إحصائيات عامة للوحة التحكم (مع خيارات الفلترة)
  getGlobalStats: async (filters?: { day?: string; weekId?: string; teacher?: string; className?: string; subject?: string }) => {
    let query = supabase.from('schedules').select('status');

    if (filters?.day && filters.day !== 'all') {
      query = query.eq('day', filters.day);
    }

    if (filters?.weekId && filters.weekId !== 'all') {
      query = query.eq('week_id', filters.weekId);
    }

    if (filters?.teacher && filters.teacher !== 'all') {
      query = query.eq('teacher', filters.teacher);
    }

    if (filters?.className && filters.className !== 'all') {
      query = query.eq('class', filters.className);
    }

    if (filters?.subject && filters.subject !== 'all') {
      query = query.eq('subject', filters.subject);
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
  getRecentLogs: async (filters?: { teacher?: string; className?: string; subject?: string }) => {
    // جلب السجلات
    let logsQuery = supabase
      .from('attendance_logs')
      .select(`
        id,
        status,
        recorded_at,
        schedule_id,
        schedule:schedules!attendance_logs_schedule_id_fkey(teacher, class, subject),
        user:users!attendance_logs_recorded_by_fkey(name, email)
      `);

    if (filters?.teacher && filters.teacher !== 'all') {
      logsQuery = logsQuery.filter('schedule.teacher', 'eq', filters.teacher);
    }
    if (filters?.className && filters.className !== 'all') {
      logsQuery = logsQuery.filter('schedule.class', 'eq', filters.className);
    }
    if (filters?.subject && filters.subject !== 'all') {
      logsQuery = logsQuery.filter('schedule.subject', 'eq', filters.subject);
    }

    const { data: logsData, error: logsError } = await logsQuery
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
      if (!log.schedule) continue; // تم تصفيته بواسطة Foreign Table Filter
      
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

    // 2. جلب السجلات لهذه الحصص (حالة غياب أو تأخر أو حضور)
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
      .in('status', ['absent', 'late', 'present'])
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
      }
    }

    return uniqueLogs;
  },

  // 6. جلب تحليلات الغياب (المناطق الأكثر تضرراً)
  getAbsenceAnalytics: async (filters?: { weekId?: string; teacher?: string; className?: string; subject?: string }) => {
    let query = supabase
      .from('attendance_logs')
      .select(`
        status,
        recorded_at,
        schedule:schedules!attendance_logs_schedule_id_fkey(teacher, class, subject, week_id)
      `)
      .eq('status', 'absent');

    if (filters?.weekId && filters.weekId !== 'all') {
      query = query.filter('schedule.week_id', 'eq', filters.weekId);
    }
    if (filters?.teacher && filters.teacher !== 'all') {
      query = query.filter('schedule.teacher', 'eq', filters.teacher);
    }
    if (filters?.className && filters.className !== 'all') {
      query = query.filter('schedule.class', 'eq', filters.className);
    }
    if (filters?.subject && filters.subject !== 'all') {
      query = query.filter('schedule.subject', 'eq', filters.subject);
    }

    const { data, error } = await query;
    if (error) throw error;

    const teacherAbsences: Record<string, { count: number; name: string; subject: string; class: string }> = {};
    const classAbsences: Record<string, number> = {};
    const teacherAbsenceEvents = new Set<string>();

    data?.forEach((log: any) => {
      const teacher = log.schedule?.teacher;
      const className = log.schedule?.class;
      const subject = log.schedule?.subject || '';
      const date = log.recorded_at ? log.recorded_at.split('T')[0] : '';

      if (teacher) {
        // مفتاح التجميع سيكون (الاسم + المادة + القسم)
        const teacherKey = `${teacher}|${subject}|${className}`;
        
        // مفتاح الحدث للتأكد من حساب غياب يوم واحد للحصة/المادة كحدث واحد
        const eventKey = `${teacherKey}_${date}`;
        
        if (!teacherAbsenceEvents.has(eventKey)) {
          teacherAbsenceEvents.add(eventKey);
          if (!teacherAbsences[teacherKey]) {
            teacherAbsences[teacherKey] = { count: 0, name: teacher, subject, class: className };
          }
          teacherAbsences[teacherKey].count += 1;
        }
      }
      if (className) {
        classAbsences[className] = (classAbsences[className] || 0) + 1;
      }
    });

    // تحويل الكائنات إلى مصفوفات مرتبة
    const topTeachers = Object.values(teacherAbsences)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topClasses = Object.entries(classAbsences)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { topTeachers, topClasses };
  }
};