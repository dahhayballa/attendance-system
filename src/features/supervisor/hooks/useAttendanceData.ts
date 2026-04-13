import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';
import type { FilterOptions } from '../types';
import { useAuth } from '../../auth/hooks/useAuth';
import { useActiveWeek } from '../../../shared/hooks/useActiveWeek';

/* ═══════════ Types ═══════════ */

export interface AttendanceRecord {
    id: string;
    schedule_id: string;
    teacher: string;
    subject: string;
    class: string;
    room: string;
    time_start: string;
    time_end: string;
    day: string;
    attendance_status: 'present' | 'absent' | 'late' | 'excused' | null;
    late_minutes?: number;
    notes?: string;
    recorded_at?: string;
}

export type SortField = 'teacher' | 'subject' | 'class' | 'room' | 'attendance_status';
export type SortDir = 'asc' | 'desc';

interface UseAttendanceDataOptions {
    filters: Partial<FilterOptions>;
    page: number;
    pageSize: number;
    sortField: SortField;
    sortDir: SortDir;
    statusFilter: string;
}

interface UseAttendanceDataReturn {
    records: AttendanceRecord[];
    totalCount: number;
    loading: boolean;
    error: string | null;
    refetch: () => void;
    updateStatus: (scheduleId: string, status: string, notes?: string) => Promise<boolean>;
    bulkUpdateStatus: (scheduleIds: string[], status: string) => Promise<boolean>;
}

/**
 * Hook pour récupérer les données de la table d'attendance
 * avec pagination côté serveur, tri, et filtres.
 */
export const useAttendanceData = (options: UseAttendanceDataOptions): UseAttendanceDataReturn => {
    const { filters, page, pageSize, sortField, sortDir, statusFilter } = options;
    const { user } = useAuth();
    const { activeWeek } = useActiveWeek();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Construire la requête sur schedules
            let query = supabase
                .from('schedules')
                .select('*', { count: 'exact' });

            if (activeWeek?.id) {
                query = query.eq('week_id', activeWeek.id);
            }

            // Appliquer les filtres
            if (filters.day) query = query.eq('day', filters.day);
            if (filters.class) query = query.eq('class', filters.class);
            if (filters.teacher) query = query.ilike('teacher', `%${filters.teacher}%`);
            if (filters.subject) query = query.eq('subject', filters.subject);
            if (filters.room) query = query.eq('room', filters.room);

            // Filtrer par statut
            if (statusFilter && statusFilter !== 'all') {
                if (statusFilter === 'not_recorded') {
                    query = query.eq('status', 'pending');
                } else {
                    query = query.neq('status', 'pending');
                }
            }

            // Tri
            query = query.order(sortField === 'attendance_status' ? 'status' : sortField, {
                ascending: sortDir === 'asc',
            });

            // Pagination
            const from = page * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data, error: fetchError, count } = await query;
            if (fetchError) throw fetchError;

            // Mapper les données
            const mapped: AttendanceRecord[] = (data || []).map((row: any) => ({
                id: row.id,
                schedule_id: row.id,
                teacher: row.teacher || '',
                subject: row.subject || '',
                class: row.class || '',
                room: row.room || '',
                time_start: row.time_start || '',
                time_end: row.time_end || '',
                day: row.day || '',
                attendance_status: row.status === 'pending' ? null :
                    (row.status as AttendanceRecord['attendance_status']),
                recorded_at: row.recorded_at,
                notes: undefined,
                late_minutes: undefined,
            }));

            setRecords(mapped);
            setTotalCount(count || 0);
        } catch (err: any) {
            console.error('[useAttendanceData] Erreur:', err);
            setError('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    }, [filters, page, pageSize, sortField, sortDir, statusFilter, activeWeek?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Enregistrer/modifier un statut
    const updateStatus = useCallback(async (
        scheduleId: string,
        status: string,
        notes?: string
    ): Promise<boolean> => {
        if (!user) return false;
        try {
            // Mettre à jour le statut dans la table schedules
            const { error: updateError } = await supabase
                .from('schedules')
                .update({
                    status: status === 'not_recorded' ? 'pending' : 'completed',
                    recorded_by: user.id,
                    recorded_at: new Date().toISOString(),
                })
                .eq('id', scheduleId);

            if (updateError) throw updateError;

            // Insérer dans attendance_logs
            if (status !== 'not_recorded') {
                await supabase.from('attendance_logs').insert([{
                    schedule_id: scheduleId,
                    recorded_by: user.id,
                    status,
                    recorded_at: new Date().toISOString(),
                    session_date: new Date().toISOString().split('T')[0],
                }]);
            }

            // Mise à jour optimiste
            setRecords(prev => prev.map(r =>
                r.schedule_id === scheduleId
                    ? { ...r, attendance_status: status as any, recorded_at: new Date().toISOString(), notes }
                    : r
            ));

            return true;
        } catch (err: any) {
            console.error('[useAttendanceData] Erreur update:', err);
            return false;
        }
    }, [user]);

    // Mise à jour en masse
    const bulkUpdateStatus = useCallback(async (
        scheduleIds: string[],
        status: string
    ): Promise<boolean> => {
        if (!user || scheduleIds.length === 0) return false;
        try {
            const { error: updateError } = await supabase
                .from('schedules')
                .update({
                    status: 'completed',
                    recorded_by: user.id,
                    recorded_at: new Date().toISOString(),
                })
                .in('id', scheduleIds);

            if (updateError) throw updateError;

            // Insérer les logs
            const logs = scheduleIds.map(sid => ({
                schedule_id: sid,
                recorded_by: user.id,
                status,
                recorded_at: new Date().toISOString(),
                session_date: new Date().toISOString().split('T')[0],
            }));
            await supabase.from('attendance_logs').insert(logs);

            // Mise à jour optimiste
            setRecords(prev => prev.map(r =>
                scheduleIds.includes(r.schedule_id)
                    ? { ...r, attendance_status: status as any, recorded_at: new Date().toISOString() }
                    : r
            ));

            return true;
        } catch (err: any) {
            console.error('[useAttendanceData] Erreur bulk update:', err);
            return false;
        }
    }, [user]);

    return { records, totalCount, loading, error, refetch: fetchData, updateStatus, bulkUpdateStatus };
};
