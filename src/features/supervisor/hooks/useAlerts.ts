import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../services/supabase/client';
import { useActiveWeek } from '../../../shared/hooks/useActiveWeek';

/* ═══════════ Types ═══════════ */

export type AlertType = 'critical' | 'warning' | 'info' | 'history';

export interface AlertAction {
    label: string;
    type: 'record_attendance' | 'ignore' | 'view' | 'custom';
    primary?: boolean;
}

export interface Alert {
    id: string;
    type: AlertType;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionable: boolean;
    actions?: AlertAction[];
    metadata?: {
        teacher?: string;
        class?: string;
        room?: string;
        time?: string;
        schedule_id?: string;
        scheduleIds?: string[];
    };
}

export interface AlertSettings {
    enabledTypes: { critical: boolean; warning: boolean; info: boolean };
    sound: boolean;
    desktopNotifications: boolean;
    autoRefresh: number;
}

const DEFAULT_SETTINGS: AlertSettings = {
    enabledTypes: { critical: true, warning: true, info: true },
    sound: false,
    desktopNotifications: false,
    autoRefresh: 60,
};

const SETTINGS_KEY = 'supervisor_alert_settings';

/* ═══════════ Hook ═══════════ */

export const useAlerts = () => {
    const { activeWeek } = useActiveWeek();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [settings, setSettings] = useState<AlertSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const prevCountRef = useRef(0);

    // Load settings from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (stored) setSettings(JSON.parse(stored));
        } catch { /* ignore */ }
    }, []);

    const saveSettings = useCallback((s: AlertSettings) => {
        setSettings(s);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    }, []);

    // Jour actuel en arabe
    const getTodayName = (): string => {
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return days[new Date().getDay()];
    };

    const timeToMinutes = (t: string): number => {
        const parts = t.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    };

    // ═══ Generate alerts from current data ═══
    const generateAlerts = useCallback(async () => {
        try {
            const todayName = getTodayName();
            let query = supabase
                .from('schedules')
                .select('*')
                .eq('day', todayName)
                .order('time_start', { ascending: true });

            if (activeWeek?.id) {
                query = query.eq('week_id', activeWeek.id);
            }

            const { data: schedules, error } = await query;

            if (error) throw error;
            if (!schedules) return;

            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const newAlerts: Alert[] = [];

            // ── CRITICAL: Classes en cours sans enregistrement ──
            const ongoingUnrecorded = schedules.filter(s => {
                const start = timeToMinutes(s.time_start);
                const end = timeToMinutes(s.time_end);
                return currentMinutes >= start && currentMinutes < end &&
                    (s.status === 'pending' || !s.status);
            });

            ongoingUnrecorded.forEach(s => {
                const elapsed = currentMinutes - timeToMinutes(s.time_start);
                if (elapsed >= 10) { // Critique si >10 min sans enregistrement
                    newAlerts.push({
                        id: `critical-${s.id}`,
                        type: 'critical',
                        title: 'حصة بدون تسجيل حضور',
                        message: `${s.teacher} — ${s.subject} في ${s.room || 'غير محدد'} (${s.time_start})`,
                        timestamp: now,
                        read: false,
                        actionable: true,
                        actions: [
                            { label: 'تسجيل غياب', type: 'record_attendance', primary: true },
                            { label: 'تجاهل', type: 'ignore' },
                        ],
                        metadata: { teacher: s.teacher, class: s.class, room: s.room, time: s.time_start, schedule_id: s.id },
                    });
                }
            });

            // ── WARNING: Profs pas encore marqués (5+ min après début) ──
            const unmarked = schedules.filter(s => {
                const start = timeToMinutes(s.time_start);
                return currentMinutes >= start + 5 && currentMinutes < timeToMinutes(s.time_end) &&
                    (s.status === 'pending' || !s.status);
            });

            if (unmarked.length > 0 && unmarked.length <= 5) {
                // Individual warnings for few teachers
                unmarked.forEach(s => {
                    if (!newAlerts.find(a => a.metadata?.schedule_id === s.id)) {
                        newAlerts.push({
                            id: `warn-unmarked-${s.id}`,
                            type: 'warning',
                            title: 'أستاذ لم يسجل حضوره بعد',
                            message: `${s.teacher} (${s.class}) — ${s.time_start}`,
                            timestamp: now,
                            read: false,
                            actionable: true,
                            actions: [
                                { label: 'تسجيل حاضر', type: 'record_attendance', primary: true },
                                { label: 'تجاهل', type: 'ignore' },
                            ],
                            metadata: { teacher: s.teacher, class: s.class, schedule_id: s.id },
                        });
                    }
                });
            } else if (unmarked.length > 5) {
                // Group warning
                newAlerts.push({
                    id: `warn-group-unmarked`,
                    type: 'warning',
                    title: `${unmarked.length} أساتذة لم يسجلوا حضورهم بعد`,
                    message: unmarked.slice(0, 3).map(s => `${s.teacher} (${s.class})`).join(' • ') +
                        (unmarked.length > 3 ? ` و ${unmarked.length - 3} آخرين` : ''),
                    timestamp: now,
                    read: false,
                    actionable: true,
                    actions: [
                        { label: 'تسجيل الكل', type: 'record_attendance', primary: true },
                        { label: 'تجاهل', type: 'ignore' },
                    ],
                    metadata: { scheduleIds: unmarked.map(s => s.id) },
                });
            }

            // ── INFO: Prochaine classe dans <15 min ──
            const upcoming = schedules.filter(s => {
                const start = timeToMinutes(s.time_start);
                const diff = start - currentMinutes;
                return diff > 0 && diff <= 15;
            });

            upcoming.forEach(s => {
                const minutesUntil = timeToMinutes(s.time_start) - currentMinutes;
                newAlerts.push({
                    id: `info-upcoming-${s.id}`,
                    type: 'info',
                    title: `الحصة القادمة بعد ${minutesUntil} دقيقة`,
                    message: `${s.teacher} — ${s.subject} في ${s.room || '—'} (${s.class})`,
                    timestamp: now,
                    read: false,
                    actionable: false,
                    metadata: { teacher: s.teacher, class: s.class, room: s.room, time: s.time_start, schedule_id: s.id },
                });
            });

            // ── WARNING: Taux de présence bas ──
            const completed = schedules.filter(s =>
                timeToMinutes(s.time_end) <= currentMinutes
            );
            if (completed.length > 0) {
                const absent = completed.filter(s => s.status === 'absent');
                if (completed.length >= 5 && absent.length / completed.length > 0.3) {
                    newAlerts.push({
                        id: `warn-low-rate`,
                        type: 'warning',
                        title: 'نسبة غياب مرتفعة',
                        message: `${absent.length} غياب من ${completed.length} حصة منتهية (${Math.round(absent.length / completed.length * 100)}%)`,
                        timestamp: now,
                        read: false,
                        actionable: false,
                    });
                }
            }

            // ── HISTORY: Recent recordings ──
            const recentRecorded = schedules
                .filter(s => s.recorded_at && s.status && s.status !== 'pending')
                .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
                .slice(0, 3);

            recentRecorded.forEach(s => {
                const statusLabel = s.status === 'present' || s.status === 'completed' ? 'حضور' :
                    s.status === 'absent' ? 'غياب' : s.status === 'late' ? 'تأخر' : 'مبرر';
                newAlerts.push({
                    id: `history-${s.id}`,
                    type: 'history',
                    title: `تم تسجيل ${statusLabel}`,
                    message: `${s.teacher} — ${s.subject}`,
                    timestamp: new Date(s.recorded_at),
                    read: true,
                    actionable: false,
                    metadata: { teacher: s.teacher, class: s.class, schedule_id: s.id },
                });
            });

            // Filter by settings
            const filtered = newAlerts.filter(a => {
                if (a.type === 'critical') return settings.enabledTypes.critical;
                if (a.type === 'warning') return settings.enabledTypes.warning;
                if (a.type === 'info') return settings.enabledTypes.info;
                return true; // history always shown
            });

            // Merge with existing read states
            setAlerts(prev => {
                const readIds = new Set(prev.filter(a => a.read).map(a => a.id));
                return filtered.map(a => ({ ...a, read: readIds.has(a.id) ? true : a.read }));
            });

            // Desktop notification for new critical alerts
            const newCriticalCount = filtered.filter(a => a.type === 'critical').length;
            if (newCriticalCount > prevCountRef.current && settings.desktopNotifications) {
                if (Notification.permission === 'granted') {
                    new Notification('⚠️ تنبيه عاجل', {
                        body: `${newCriticalCount} تنبيه عاجل جديد`,
                        icon: '/favicon.ico',
                    });
                }
            }
            prevCountRef.current = newCriticalCount;

            setLoading(false);
        } catch (err) {
            console.error('[useAlerts] Erreur:', err);
            setLoading(false);
        }
    }, [settings, activeWeek?.id]);

    // Initial fetch + interval
    useEffect(() => {
        generateAlerts();
        intervalRef.current = setInterval(generateAlerts, settings.autoRefresh * 1000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [generateAlerts, settings.autoRefresh]);

    // Realtime
    useEffect(() => {
        const channel = supabase
            .channel('alerts_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => generateAlerts())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [generateAlerts]);

    // Actions
    const markAsRead = useCallback((id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    }, []);

    const dismissAlert = useCallback((id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    }, []);

    const dismissAll = useCallback(() => {
        setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    }, []);

    const requestDesktopPermission = useCallback(async () => {
        if ('Notification' in window) {
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
                saveSettings({ ...settings, desktopNotifications: true });
            }
        }
    }, [settings, saveSettings]);

    const unreadCount = alerts.filter(a => !a.read).length;

    return {
        alerts,
        unreadCount,
        loading,
        settings,
        saveSettings,
        markAsRead,
        dismissAlert,
        dismissAll,
        refetch: generateAlerts,
        requestDesktopPermission,
    };
};
