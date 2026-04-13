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
  getGlobalStats: async (filters?: { day?: string; weekId?: string; teacher?: string; className?: string; subject?: string; isLive?: boolean; exactDateStart?: string; exactDateEnd?: string }) => {
    let query = supabase.from('schedules').select('id, status');

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

    const { data: schedData, error } = await query;

    if (error) throw error;

    const total = schedData?.length || 0;

    if (filters?.isLive) {
      if (total === 0) {
        return { total, present: 0, late: 0, absent: 0, recorded: 0, rate: 0 };
      }
      
      const scheduleIds = schedData.map(s => s.id);
      let logsQuery = supabase
        .from('attendance_logs')
        .select('schedule_id, status')
        .in('schedule_id', scheduleIds)
        .order('recorded_at', { ascending: false });

      if (filters.exactDateStart) {
        logsQuery = logsQuery.gte('recorded_at', filters.exactDateStart);
      } else {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        logsQuery = logsQuery.gte('recorded_at', todayStart.toISOString());
      }

      if (filters.exactDateEnd) {
        logsQuery = logsQuery.lte('recorded_at', filters.exactDateEnd);
      }

      const { data: logsData, error: logsErr } = await logsQuery;

      if (logsErr) throw logsErr;

      // Only count latest log per schedule for today
      const uniqueLogs = new Map<string, string>();
      logsData?.forEach(log => {
        if (!uniqueLogs.has(log.schedule_id)) {
          uniqueLogs.set(log.schedule_id, log.status);
        }
      });

      const present = Array.from(uniqueLogs.values()).filter(s => s === 'present').length;
      const late = Array.from(uniqueLogs.values()).filter(s => s === 'late').length;
      const absent = Array.from(uniqueLogs.values()).filter(s => s === 'absent').length;
      const recorded = present + late + absent;

      return {
        total,
        present,
        late,
        absent,
        recorded,
        rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0
      };
    }

    // Default behavior for Admin Dashboard
    const present = schedData?.filter(d => d.status === 'present').length || 0;
    const late = schedData?.filter(d => d.status === 'late').length || 0;
    const absent = schedData?.filter(d => d.status === 'absent').length || 0;
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

  getWeeksWithCounts: async () => {
    // 1. Get all weeks
    const { data: weeks, error: weeksError } = await supabase
      .from('weeks')
      .select('id, name, start_date')
      .order('start_date', { ascending: false });

    if (weeksError) throw weeksError;

    // 2. For each week, get counts
    // We'll do this in parallel to be efficient
    const weeksWithStats = await Promise.all(weeks.map(async (week) => {
      // Total schedules in this week
      const { count: total, error: countErr } = await supabase
        .from('schedules')
        .select('*', { count: 'exact', head: true })
        .eq('week_id', week.id);
      
      if (countErr) throw countErr;

      // 2. For each week, get counts
      // We'll do this by first getting all schedule IDs for this week
      const { data: schedIdsData } = await supabase.from('schedules').select('id').eq('week_id', week.id);
      const scheduleIds = (schedIdsData || []).map(s => s.id);
      
      let recorded = 0;
      if (scheduleIds.length > 0) {
        const { data: uniqueLogs, error: uniqueLogsErr } = await supabase
          .from('attendance_logs')
          .select('schedule_id, status')
          .in('schedule_id', scheduleIds);
        
        if (uniqueLogsErr) throw uniqueLogsErr;
        
        // Count unique schedule IDs that have logs
        recorded = new Set(uniqueLogs?.map(l => l.schedule_id)).size;
        
        // Also count presence for rate
        const presentCount = uniqueLogs?.filter(l => l.status === 'present' || l.status === 'late').length || 0;
        const rate = total && total > 0 ? Math.round((presentCount / total) * 100) : 0;

        return {
          ...week,
          stats: {
            total: total || 0,
            recorded,
            rate
          }
        };
      }

      return {
        ...week,
        stats: {
          total: total || 0,
          recorded: 0,
          rate: 0
        }
      };
    }));

    return weeksWithStats;
  },

  // 3. حذف أسبوع وكل ما يتعلق به (Cascade Delete)
  deleteWeek: async (weekId: string) => {
    // 1. Get all schedules for this week
    const { data: schedules } = await supabase
      .from('schedules')
      .select('id')
      .eq('week_id', weekId);

    if (schedules && schedules.length > 0) {
      const scheduleIds = schedules.map(s => s.id);
      
      // 2. Delete attendance logs for these schedules in chunks to avoid URL length limits
      const chunkSize = 200;
      for (let i = 0; i < scheduleIds.length; i += chunkSize) {
        const chunk = scheduleIds.slice(i, i + chunkSize);
        await supabase
          .from('attendance_logs')
          .delete()
          .in('schedule_id', chunk);
      }

      // 3. Delete schedules
      await supabase
        .from('schedules')
        .delete()
        .eq('week_id', weekId);
    }

    // 4. Finally delete the week
    const { error } = await supabase
      .from('weeks')
      .delete()
      .eq('id', weekId);

    if (error) throw error;
    return true;
  },

  // 3.ب تعيين الأسبوع النشط
  setActiveWeek: async (_weekId: string) => {
    // Note: is_active column is missing from DB. This is a placeholder.
    console.warn('setActiveWeek: is_active column missing in DB');
    return true;
  },

  // 4. جلب آخر النشاطات (مع المشرفين المعينين)
  getRecentLogs: async (filters?: { weekId?: string; teacher?: string; className?: string; subject?: string }) => {
    // جلب السجلات
    let logsQuery = supabase
      .from('attendance_logs')
      .select(`
        id,
        status,
        recorded_at,
        schedule_id,
        schedule:schedules!attendance_logs_schedule_id_fkey(teacher, class, subject, week_id),
        user:users!attendance_logs_recorded_by_fkey(name, email)
      `);

    if (filters?.weekId && filters.weekId !== 'all') {
      logsQuery = logsQuery.filter('schedule.week_id', 'eq', filters.weekId);
    }
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
  getLiveAlerts: async (filters?: { day?: string; weekId?: string; exactDateStart?: string; exactDateEnd?: string }) => {
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
    let logsQuery = supabase
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

    if (filters?.exactDateStart) {
      logsQuery = logsQuery.gte('recorded_at', filters.exactDateStart);
    } else {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      logsQuery = logsQuery.gte('recorded_at', todayStart.toISOString());
    }

    if (filters?.exactDateEnd) {
      logsQuery = logsQuery.lte('recorded_at', filters.exactDateEnd);
    }

    const { data: logsData, error: logsError } = await logsQuery;

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
  },

  // 7. جلب سجلات التدقيق الكاملة (لصفحة Audit Logs)
  getAuditLogs: async (filters: { startDate?: string; endDate?: string; supervisorId?: string; status?: string }) => {
    let query = supabase
      .from('attendance_logs')
      .select(`
        id,
        status,
        recorded_at,
        reason,
        schedule:schedules!attendance_logs_schedule_id_fkey(teacher, class, subject),
        user:users!attendance_logs_recorded_by_fkey(name, email)
      `)
      .order('recorded_at', { ascending: false });

    if (filters.startDate) {
      query = query.gte('recorded_at', `${filters.startDate}T00:00:00`);
    }
    if (filters.endDate) {
      query = query.lte('recorded_at', `${filters.endDate}T23:59:59`);
    }
    if (filters.supervisorId && filters.supervisorId !== 'all') {
      query = query.eq('recorded_by', filters.supervisorId);
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.limit(500); // Limite raisonnable pour l'audit

    if (error) throw error;
    return (data || []).map((log: any) => ({
        ...log,
        note: log.reason, // Renvoyé pour compatibilité avec le UI
        user_name: log.user?.name || log.user?.email?.split('@')[0] || 'Système'
    }));
  }
};