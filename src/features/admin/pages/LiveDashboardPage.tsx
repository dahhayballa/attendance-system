import { useState, useEffect } from 'react';
import { Layout } from '../../../shared/components/layout/Layout';
import { realtimeService, Notification } from '../../../services/supabase/realtime.service';
import Card from '../../../shared/components/ui/Card';
import { useToast } from '../../../shared/hooks/useToast';
import { Bell, Clock, Activity, AlertTriangle, UserCheck, XCircle } from 'lucide-react';
import { adminService } from '../../../services/supabase/admin.service';

export const LiveDashboardPage = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0 });
    const { toast } = useToast();

    useEffect(() => {
        loadData();

        // 1. Subscribe to notifications (Appears as completely new records)
        const notifSub = realtimeService.subscribeToNotifications((newNotif) => {
            setNotifications(prev => [newNotif, ...prev].slice(0, 20));
            // Show toast visually
            if (newNotif.type === 'absent') {
                toast.error(newNotif.message);
                // Optional: Play a sound
                const audio = new Audio('/notification-sound.mp3');
                audio.play().catch(e => console.log('Audio play failed', e));
            } else if (newNotif.type === 'late') {
                toast.warning(newNotif.message);
            } else {
                toast.info(newNotif.message);
            }
        });

        // 2. Subscribe to attendance live changes
        const attendSub = realtimeService.subscribeToAttendanceLive(() => {
            // Reload partial data when someone marks attendance
            loadData();
        });

        return () => {
            notifSub?.unsubscribe();
            attendSub?.unsubscribe();
        };
    }, []);

    const loadData = async () => {
        try {
            const logsData = await adminService.getRecentLogs();
            setRecentLogs(logsData);

            const notifs = await realtimeService.getRecentNotifications(15);
            setNotifications(notifs);

            const s = await adminService.getGlobalStats();
            setStats(s as any);
        } catch (error) {
            console.error(error);
        }
    };

    const markAsRead = async (id: string, currentlyRead: boolean) => {
        if (currentlyRead) return;
        try {
            await realtimeService.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (e) { }
    };

    return (
        <Layout>
            <div className="flex flex-col gap-6" dir="ltr">
                <div className="flex justify-between items-center bg-white border border-gray-100 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                    
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 border-l-4 border-orange-500 pl-3">
                            <Activity className="text-orange-500 animate-pulse" /> Suivi en Direct
                        </h2>
                        <p className="text-gray-500 mt-2 font-medium">Les données et alertes sont mises à jour instantanément sans avoir besoin d'actualiser la page.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Colonne Notifications/Alertes */}
                    <Card className="lg:col-span-1 shadow-sm h-[600px] flex flex-col border-gray-100" padding="p-0">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-bold text-gray-800 flex items-center gap-2 sticky top-0 z-10 px-5">
                            <Bell size={18} className="text-orange-500" />
                            Alertes instantanées
                            <span className="bg-orange-500 text-white text-xs px-2.5 py-0.5 rounded-full ml-auto shadow-sm">
                                {notifications.filter(n => !n.read).length} nouveau
                            </span>
                        </div>
                        <div className="overflow-y-auto flex-1 p-3 space-y-2">
                            {notifications.length === 0 ? (
                                <p className="text-center text-gray-400 font-medium py-10">Aucune alerte pour le moment</p>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => markAsRead(n.id, n.read)}
                                        className={`p-4 rounded-xl border-l-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                                            n.type === 'absent' ? 'border-red-500 bg-red-50 hover:shadow-md' :
                                            n.type === 'late' ? 'border-amber-500 bg-amber-50 hover:shadow-md' :
                                            'border-blue-500 bg-blue-50 hover:shadow-md'
                                        } ${!n.read ? 'opacity-100' : 'opacity-60 grayscale-[30%]'}`}
                                    >
                                        <h4 className={`font-bold text-sm ${
                                            n.type === 'absent' ? 'text-red-700' :
                                            n.type === 'late' ? 'text-amber-700' :
                                            'text-blue-700'
                                        }`}>{n.title}</h4>
                                        <p className="text-xs text-gray-600 font-medium mt-1.5 leading-relaxed">{n.message}</p>
                                        <p className="text-[10px] font-bold text-gray-400 mt-2 flex justify-end">
                                            {new Date(n.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Colonne Stats & Activités */}
                    <div className="lg:col-span-2 space-y-6 flex flex-col">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col items-center justify-center transition-transform hover:scale-105">
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Séances</span>
                                <span className="text-3xl font-black text-gray-900">{stats.total}</span>
                            </div>
                            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 shadow-sm flex flex-col items-center justify-center transition-transform hover:scale-105">
                                <span className="text-green-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1"><UserCheck size={14} /> Présents</span>
                                <span className="text-3xl font-black text-green-700">{stats.present}</span>
                            </div>
                            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col items-center justify-center transition-transform hover:scale-105">
                                <span className="text-red-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1"><XCircle size={14} /> Absents</span>
                                <span className="text-3xl font-black text-red-700">{stats.absent}</span>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col items-center justify-center transition-transform hover:scale-105">
                                <span className="text-amber-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1"><AlertTriangle size={14} /> En retard</span>
                                <span className="text-3xl font-black text-amber-700">{stats.late || 0}</span>
                            </div>
                        </div>

                        <Card className="shadow-sm flex-1 border-gray-100" padding="p-0">
                            <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-bold text-gray-800 flex items-center gap-2 px-5">
                                <Clock size={18} className="text-orange-500" />
                                Activité des Superviseurs (Derniers enregistrements)
                            </div>
                            <div className="p-4">
                                <div className="space-y-3">
                                    {recentLogs.map((log: any) => (
                                        <div key={log.id} className="flex justify-between items-center p-4 rounded-xl border border-gray-100 hover:bg-orange-50/30 transition-colors">
                                            <div>
                                                <div className="font-bold text-gray-900 text-sm mb-1">{log.schedule?.teacher}</div>
                                                <div className="text-xs font-medium text-gray-500">
                                                    {log.schedule?.class} <span className="text-gray-300 mx-1">|</span> <span className="text-orange-600/80">Superviseur: {log.user_name || 'Inconnu'}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm ${
                                                    log.status === 'present' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                    log.status === 'absent' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                    log.status === 'late' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                    'bg-blue-100 text-blue-700 border border-blue-200'
                                                }`}>
                                                    {log.status === 'present' ? 'Présent' : log.status === 'absent' ? 'Absent' : log.status === 'late' ? 'Retard' : 'Motif'}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 mt-2 flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {new Date(log.recorded_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {recentLogs.length === 0 && (
                                        <div className="text-center py-10 text-gray-400 text-sm font-medium">
                                            Aucun enregistrement récent
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LiveDashboardPage;
