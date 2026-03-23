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
            <div className="flex flex-col gap-6" dir="rtl">
                <div className="flex justify-between items-center bg-gray-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Activity className="text-red-400 animate-pulse" /> لوحة المراقبة الحية (Live)
                        </h2>
                        <p className="text-gray-400 mt-1">يتم تحديث البيانات والإشعارات فورياً دون الحاجة لتحديث الصفحة</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* عمود الإشعارات */}
                    <Card className="lg:col-span-1 shadow-sm h-[600px] flex flex-col" padding="p-0">
                        <div className="p-4 border-b bg-gray-50 font-bold text-gray-700 flex items-center gap-2 sticky top-0 z-10">
                            <Bell size={18} className="text-amber-500" />
                            تنبيهات فورية
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full mr-auto">
                                {notifications.filter(n => !n.read).length} جديد
                            </span>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {notifications.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">لا توجد إشعارات حالياً</p>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => markAsRead(n.id, n.read)}
                                        className={`p-3 rounded-xl border-r-4 cursor-pointer transition-colors ${n.type === 'absent' ? 'border-red-500 bg-red-50' :
                                            n.type === 'late' ? 'border-amber-500 bg-amber-50' :
                                                'border-blue-500 bg-blue-50'
                                            } ${!n.read ? 'opacity-100 shadow-sm' : 'opacity-60 grayscale-[50%]'}`}
                                    >
                                        <h4 className={`font-bold text-sm ${n.type === 'absent' ? 'text-red-700' :
                                            n.type === 'late' ? 'text-amber-700' :
                                                'text-blue-700'
                                            }`}>{n.title}</h4>
                                        <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-2" dir="ltr text-right">
                                            {new Date(n.created_at).toLocaleTimeString('ar-MR')}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* عمود الخريطة والنشاطات */}
                    <div className="lg:col-span-2 space-y-6 flex flex-col">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                                <span className="text-gray-500 text-sm">الحصص</span>
                                <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm flex flex-col items-center justify-center">
                                <span className="text-green-600 text-sm flex items-center gap-1"><UserCheck size={14} /> حضور</span>
                                <span className="text-2xl font-bold text-green-700">{stats.present}</span>
                            </div>
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm flex flex-col items-center justify-center">
                                <span className="text-red-600 text-sm flex items-center gap-1"><XCircle size={14} /> غياب</span>
                                <span className="text-2xl font-bold text-red-700">{stats.absent}</span>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col items-center justify-center">
                                <span className="text-amber-600 text-sm flex items-center gap-1"><AlertTriangle size={14} /> تأخر</span>
                                <span className="text-2xl font-bold text-amber-700">{stats.late || 0}</span>
                            </div>
                        </div>

                        <Card className="shadow-sm flex-1" padding="p-0">
                            <div className="p-4 border-b bg-gray-50 font-bold text-gray-700 flex items-center gap-2">
                                <Clock size={18} className="text-blue-500" />
                                تتبع المشرفين (آخر التسجيلات الميدانية)
                            </div>
                            <div className="p-4">
                                <div className="space-y-3">
                                    {recentLogs.map((log: any) => (
                                        <div key={log.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                                            <div>
                                                <div className="font-bold text-gray-800 text-sm">{log.schedule?.teacher}</div>
                                                <div className="text-xs text-gray-500">{log.schedule?.class} | المشرف: {log.user_name || 'غير معروف'}</div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${log.status === 'present' ? 'bg-green-100 text-green-700' :
                                                    log.status === 'absent' ? 'bg-red-100 text-red-700' :
                                                        log.status === 'late' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {log.status === 'present' ? 'حاضر' : log.status === 'absent' ? 'غائب' : log.status === 'late' ? 'متأخر' : 'ملاحظة'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 mt-1" dir="ltr">{new Date(log.recorded_at).toLocaleTimeString('ar-MR')}</span>
                                            </div>
                                        </div>
                                    ))}
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
