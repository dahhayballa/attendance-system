import { supabase } from './client';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
}

export const realtimeService = {
    // Escuchar notificaciones (Admin)
    subscribeToNotifications(callback: (notification: Notification) => void) {
        return supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    callback(payload.new as Notification);
                }
            )
            .subscribe();
    },

    // Escuchar cambios de asistencia en vivo (Para Live Dashboard)
    subscribeToAttendanceLive(callback: () => void) {
        return supabase
            .channel('public:attendance_logs')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attendance_logs' },
                () => {
                    callback();
                }
            )
            .subscribe();
    },

    async getRecentNotifications(limit = 10) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data as Notification[];
    },

    async markNotificationRead(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (error) throw error;
    }
};
