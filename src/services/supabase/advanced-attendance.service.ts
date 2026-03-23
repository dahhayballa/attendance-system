import { supabase } from './client'
import { 
  AttendanceRecord, 
  AttendanceStatus, 
  DeviceInfo,
  ProfessorStats,
  StatsSummary,
  Alert
} from '../../types'

// ================================================================
// PARTIE 1: CALCULS AUTOMATIQUES
// ================================================================

export const calculateLateMinutes = (
  scheduledStart: string,
  actualTime: Date = new Date()
): number => {
  try {
    const [hours, minutes] = scheduledStart.split(':').map(Number)
    const scheduled = new Date(actualTime)
    scheduled.setHours(hours, minutes, 0, 0)
    const diffMs = actualTime.getTime() - scheduled.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    return diffMinutes > 0 ? diffMinutes : 0
  } catch (error) {
    console.error('Error calculating late minutes:', error)
    return 0
  }
}

export const calculatePoints = (
  status: AttendanceStatus,
  lateMinutes: number = 0
): number => {
  switch (status) {
    case 'present': return 10;
    case 'late':
      if (lateMinutes <= 5) return 8;
      if (lateMinutes <= 15) return 5;
      if (lateMinutes <= 30) return 2;
      return 0;
    case 'absent_justified': return 0;
    case 'exceptional': return 0;
    case 'left_early': return 3;
    case 'absent':
    default: return -10;
  }
}

export const getDeviceInfo = (): DeviceInfo => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`
  }
}

// ================================================================
// PARTIE 2: ENREGISTREMENT DE PRÉSENCE AVANCÉ
// ================================================================

export const createAdvancedAttendance = async (
  scheduleId: string,
  userId: string,
  status: AttendanceStatus,
  scheduledStart: string,
  reason?: string,
  evidenceUrl?: string
): Promise<AttendanceRecord> => {
  
  const now = new Date()
  const lateMinutes = status === 'late' ? calculateLateMinutes(scheduledStart, now) : 0
  const points = calculatePoints(status, lateMinutes)
  const deviceInfo = getDeviceInfo()
  
  const { data: attendanceLog, error: logError } = await supabase
    .from('attendance_logs')
    .insert({
      schedule_id: scheduleId,
      recorded_by: userId,
      status,
      late_minutes: lateMinutes,
      reason: reason || null,
      points,
      evidence_url: evidenceUrl || null,
      device_info: deviceInfo,
      recorded_at: now.toISOString()
    })
    .select()
    .single()
  
  if (logError) throw logError

  await supabase
    .from('schedules')
    .update({
      status,
      recorded_by: userId,
      recorded_at: now.toISOString()
    })
    .eq('id', scheduleId)
  
  await checkAndCreateAlertJS(scheduleId, status)
  
  return attendanceLog
}

/**
 * دالة التحقق من التنبيهات (تم إصلاحها لتجنب أخطاء TS6133 و TS2345)
 */
const checkAndCreateAlertJS = async (
  scheduleId: string,
  status: AttendanceStatus
) => {
  try {
    const { data: schedule } = await supabase
      .from('schedules')
      .select('teacher')
      .eq('id', scheduleId)
      .single()
    
    if (!schedule) return
    
    const professorName = schedule.teacher
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // إصلاح الخطأ: جلب المعرفات أولاً كمصفوفة
    const { data: teacherSchedules } = await supabase
        .from('schedules')
        .select('id')
        .eq('teacher', professorName);
    
    const scheduleIds = teacherSchedules?.map(s => s.id) || [];

    if (scheduleIds.length === 0) return;
    
    if (status === 'late' || status === 'absent') {
      const { count } = await supabase
        .from('attendance_logs')
        .select('id', { count: 'exact', head: true })
        .eq('status', status)
        .gte('recorded_at', startOfMonth.toISOString())
        .in('schedule_id', scheduleIds); // تمرير المصفوفة هنا
      
      const threshold = status === 'late' ? 3 : 2;
      const alertType = status === 'late' ? 'frequent_late' : 'frequent_absent';
      const severity = status === 'late' ? 'high' : 'critical';

      if (count && count >= threshold) {
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('professor_id', professorName)
          .eq('type', alertType)
          .eq('acknowledged', false)
          .single()
        
        if (!existingAlert) {
          await supabase
            .from('alerts')
            .insert({
              type: alertType,
              professor_id: professorName,
              professor_name: professorName,
              message: status === 'late' ? `${count} retards ce mois` : `${count} absences ce mois`,
              severity: severity
            })
        }
      }
    }
  } catch (error) {
    console.error('Error checking alerts:', error)
  }
}

// ================================================================
// PARTIE 3: STATISTIQUES
// ================================================================

export const getProfessorStats = async (
  professorName: string,
  weekId?: string
): Promise<ProfessorStats> => {
  
  let query = supabase
    .from('attendance_logs')
    .select(`
      id,
      status,
      late_minutes,
      points,
      schedule:schedules (
        teacher,
        subject,
        class_name,
        week_id
      )
    `)
  
  const { data, error } = await query
  
  if (error) throw error
  
  const professorData = data.filter((log: any) => {
    const matchesProfessor = log.schedule?.teacher === professorName
    const matchesWeek = !weekId || log.schedule?.week_id === weekId
    return matchesProfessor && matchesWeek
  })
  
  const total = professorData.length
  const present = professorData.filter((l: any) => l.status === 'present').length
  const late = professorData.filter((l: any) => l.status === 'late').length
  const absent = professorData.filter((l: any) => l.status === 'absent').length
  const absentJustified = professorData.filter((l: any) => l.status === 'absent_justified').length
  
  const lateMinutesSum = professorData
    .filter((l: any) => l.status === 'late')
    .reduce((sum: number, l: any) => sum + (l.late_minutes || 0), 0)
  const lateAverage = late > 0 ? Math.round(lateMinutesSum / late) : 0
  
  const pointsTotal = professorData.reduce((sum: number, l: any) => sum + (l.points || 0), 0)
  const pointsAverage = total > 0 ? Math.round(pointsTotal / total) : 0
  const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0
  
  return {
    professor_id: professorName,
    professor_name: professorName,
    total_sessions: total,
    present_count: present,
    late_count: late,
    absent_count: absent,
    absent_justified_count: absentJustified,
    late_average_minutes: lateAverage,
    attendance_rate: attendanceRate,
    points_total: pointsTotal,
    points_average: pointsAverage,
    trend: 'stable'
  }
}

export const getStatsSummary = async (
  filters?: {
    weekId?: string
    day?: string
    class?: string
  }
): Promise<StatsSummary> => {
  
  let query = supabase
    .from('schedules')
    .select(`
      id,
      status,
      attendance_logs(status, points)
    `)
  
  if (filters?.weekId) query = query.eq('week_id', filters.weekId)
  if (filters?.day) query = query.eq('day', filters.day)
  if (filters?.class) query = query.eq('class_name', filters.class)
  
  const { data, error } = await query
  if (error) throw error
  
  const total = data.length
  const statusCounts = data.reduce((acc: any, schedule: any) => {
    const status = schedule.status || 'pending'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})
  
  const present = statusCounts['present'] || 0
  const late = statusCounts['late'] || 0
  const absent = statusCounts['absent'] || 0
  const pending = statusCounts['pending'] || 0
  
  return {
    total,
    present,
    late,
    absent,
    absent_justified: statusCounts['absent_justified'] || 0,
    left_early: statusCounts['left_early'] || 0,
    exceptional: statusCounts['exceptional'] || 0,
    pending,
    recorded: total - pending,
    attendance_rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
    punctuality_rate: total > 0 ? Math.round((present / total) * 100) : 0,
    average_points: 0 // يمكن حسابه لاحقاً
  }
}

export const getUnacknowledgedAlerts = async (professorId?: string): Promise<Alert[]> => {
  let query = supabase.from('alerts').select('*').eq('acknowledged', false).order('created_at', { ascending: false })
  if (professorId) query = query.eq('professor_id', professorId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export const acknowledgeAlert = async (alertId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('alerts')
    .update({
      acknowledged: true,
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString()
    })
    .eq('id', alertId)
  if (error) throw error
}

export const formatLateTime = (minutes: number): string => {
  if (minutes === 0) return 'في الوقت'
  if (minutes === 1) return 'دقيقة واحدة'
  if (minutes === 2) return 'دقيقتان'
  if (minutes <= 10) return `${minutes} دقائق`
  return `${minutes} دقيقة`
}

export const getStatusBadge = (status: AttendanceStatus) => {
  const badges: Record<string, {text: string, color: string}> = {
    present: { text: 'حاضر', color: 'green' },
    late: { text: 'متأخر', color: 'orange' },
    absent: { text: 'غائب', color: 'red' },
    absent_justified: { text: 'غائب مبرر', color: 'yellow' },
    left_early: { text: 'خرج مبكرا', color: 'purple' },
    exceptional: { text: 'استثنائي', color: 'gray' },
    pending: { text: 'في الانتظار', color: 'blue' }
  }
  return badges[status] || badges.pending
}

export default {
  calculateLateMinutes,
  calculatePoints,
  getDeviceInfo,
  createAdvancedAttendance,
  getProfessorStats,
  getStatsSummary,
  getUnacknowledgedAlerts,
  acknowledgeAlert,
  formatLateTime,
  getStatusBadge
}