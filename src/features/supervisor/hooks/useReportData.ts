import { useState, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';
import { useActiveWeek } from '../../../shared/hooks/useActiveWeek';

/* ═══════════ Types ═══════════ */

export type ReportPeriodType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface ReportConfig {
    periodType: ReportPeriodType;
    startDate: string;
    endDate: string;
    includeTeachers: boolean;
    includeStats: boolean;
    includeDetails: boolean;
    includeNotes: boolean;
}

export interface ReportDetail {
    date: string;
    teacher: string;
    class: string;
    subject: string;
    time: string;
    room: string;
    status: string;
    notes?: string;
}

export interface ReportSummary {
    totalClasses: number;
    totalTeachers: number;
    attendanceRate: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    pendingCount: number;
}

export interface TeacherStat {
    teacher: string;
    present: number;
    absent: number;
    total: number;
    rate: number;
}

export interface ClassStat {
    class: string;
    present: number;
    absent: number;
    total: number;
    rate: number;
}

export interface ReportData {
    period: { start: string; end: string; type: ReportPeriodType; label: string };
    summary: ReportSummary;
    details: ReportDetail[];
    byTeacher: TeacherStat[];
    byClass: ClassStat[];
    generatedAt: string;
}

const DEFAULT_CONFIG: ReportConfig = {
    periodType: 'daily',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    includeTeachers: true,
    includeStats: true,
    includeDetails: false,
    includeNotes: false,
};

const DAY_NAME = (d: Date) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[d.getDay()];
};

/**
 * Hook pour générer les données d'un rapport d'attendance.
 */
export const useReportData = () => {
    const { activeWeek } = useActiveWeek();
    const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG);
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateConfig = useCallback((partial: Partial<ReportConfig>) => {
        setConfig(prev => {
            const next = { ...prev, ...partial };
            // Auto-adjust dates
            if (partial.periodType) {
                const now = new Date();
                if (partial.periodType === 'daily') {
                    next.startDate = now.toISOString().split('T')[0];
                    next.endDate = next.startDate;
                } else if (partial.periodType === 'weekly') {
                    const start = new Date(now);
                    const dayOfWeek = now.getDay();
                    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    start.setDate(now.getDate() - diffToMonday);
                    const end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    next.startDate = start.toISOString().split('T')[0];
                    next.endDate = end.toISOString().split('T')[0];
                } else if (partial.periodType === 'monthly') {
                    const start = new Date(now.getFullYear(), now.getMonth(), 1);
                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    next.startDate = start.toISOString().split('T')[0];
                    next.endDate = end.toISOString().split('T')[0];
                }
            }
            return next;
        });
    }, []);

    const generateReport = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Déterminer les jours à interroger
            const targetDay = DAY_NAME(new Date(config.startDate));

            // Récupérer les données
            let query = supabase.from('schedules').select('*');

            if (activeWeek?.id) {
                query = query.eq('week_id', activeWeek.id);
            }

            if (config.periodType === 'daily') {
                query = query.eq('day', targetDay);
            }
            // Pour weekly/monthly on récupère tout (les données sont déjà par jour de la semaine)

            const { data, error: fetchErr } = await query.order('time_start', { ascending: true });
            if (fetchErr) throw fetchErr;
            if (!data) throw new Error('Pas de données');

            // Mapper statuts
            const mapStatus = (s: string | null) => {
                if (!s || s === 'pending') return 'غير مسجل';
                if (s === 'completed' || s === 'present') return 'حاضر';
                if (s === 'absent') return 'غائب';
                if (s === 'late') return 'متأخر';
                if (s === 'excused') return 'مبرر';
                return s;
            };

            const isPresent = (s: string | null) => s === 'completed' || s === 'present';
            const isAbsent = (s: string | null) => s === 'absent';
            const isLate = (s: string | null) => s === 'late';
            const isExcused = (s: string | null) => s === 'excused';
            const isPending = (s: string | null) => !s || s === 'pending';

            // Détails
            const details: ReportDetail[] = data.map((s: any) => ({
                date: s.day,
                teacher: s.teacher || '',
                class: s.class || '',
                subject: s.subject || '',
                time: `${s.time_start || ''} - ${s.time_end || ''}`,
                room: s.room || '',
                status: mapStatus(s.status),
            }));

            // Summary
            const teachers = new Set(data.map((s: any) => s.teacher).filter(Boolean));
            const summary: ReportSummary = {
                totalClasses: data.length,
                totalTeachers: teachers.size,
                presentCount: data.filter((s: any) => isPresent(s.status)).length,
                absentCount: data.filter((s: any) => isAbsent(s.status)).length,
                lateCount: data.filter((s: any) => isLate(s.status)).length,
                excusedCount: data.filter((s: any) => isExcused(s.status)).length,
                pendingCount: data.filter((s: any) => isPending(s.status)).length,
                attendanceRate: 0,
            };
            const recorded = summary.totalClasses - summary.pendingCount;
            summary.attendanceRate = recorded > 0
                ? Math.round((summary.presentCount / recorded) * 100)
                : 0;

            // By teacher
            const teacherMap = new Map<string, { present: number; absent: number; total: number }>();
            data.forEach((s: any) => {
                if (!s.teacher) return;
                const e = teacherMap.get(s.teacher) || { present: 0, absent: 0, total: 0 };
                e.total++;
                if (isPresent(s.status)) e.present++;
                if (isAbsent(s.status)) e.absent++;
                teacherMap.set(s.teacher, e);
            });
            const byTeacher: TeacherStat[] = Array.from(teacherMap.entries())
                .map(([teacher, d]) => ({ teacher, ...d, rate: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0 }))
                .sort((a, b) => a.rate - b.rate);

            // By class
            const classMap = new Map<string, { present: number; absent: number; total: number }>();
            data.forEach((s: any) => {
                if (!s.class) return;
                const e = classMap.get(s.class) || { present: 0, absent: 0, total: 0 };
                e.total++;
                if (isPresent(s.status)) e.present++;
                if (isAbsent(s.status)) e.absent++;
                classMap.set(s.class, e);
            });
            const byClass: ClassStat[] = Array.from(classMap.entries())
                .map(([cls, d]) => ({ class: cls, ...d, rate: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0 }))
                .sort((a, b) => b.total - a.total);

            // Period label
            const periodLabel = config.periodType === 'daily'
                ? new Date(config.startDate).toLocaleDateString('ar-MR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                : `${new Date(config.startDate).toLocaleDateString('ar-MR', { month: 'long', day: 'numeric' })} — ${new Date(config.endDate).toLocaleDateString('ar-MR', { month: 'long', day: 'numeric', year: 'numeric' })}`;

            setReport({
                period: {
                    start: config.startDate,
                    end: config.endDate,
                    type: config.periodType,
                    label: periodLabel,
                },
                summary,
                details,
                byTeacher,
                byClass,
                generatedAt: new Date().toISOString(),
            });
        } catch (err: any) {
            console.error('[useReportData] Erreur:', err);
            setError('فشل في إنشاء التقرير');
        } finally {
            setLoading(false);
        }
    }, [config, activeWeek?.id]);

    return { config, updateConfig, report, loading, error, generateReport };
};
