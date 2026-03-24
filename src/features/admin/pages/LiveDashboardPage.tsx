import { useState, useEffect } from 'react';
import { Layout } from '../../../shared/components/layout/Layout';
import { realtimeService } from '../../../services/supabase/realtime.service';
import Card from '../../../shared/components/ui/Card';
import { Clock, Activity, AlertTriangle, UserCheck, XCircle } from 'lucide-react';
import { adminService } from '../../../services/supabase/admin.service';

export const LiveDashboardPage = () => {
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0 });

    useEffect(() => {
        loadData();

        // Subscribe to attendance live changes
        const attendSub = realtimeService.subscribeToAttendanceLive(() => {
            // Reload partial data when someone marks attendance
            loadData();
        });

        return () => {
            attendSub?.unsubscribe();
        };
    }, []);

    const loadData = async () => {
        try {
            const logsData = await adminService.getRecentLogs();
            setRecentLogs(logsData);

            const s = await adminService.getGlobalStats();
            setStats(s as any);
        } catch (error) {
            console.error(error);
        }
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
                        <p className="text-gray-500 mt-2 font-medium">Les données en direct sont mises à jour instantanément sans avoir besoin d'actualiser la page.</p>
                    </div>
                </div>

                <div className="space-y-6 flex flex-col">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm flex flex-col items-center justify-center transition-transform hover:scale-105">
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Séances</span>
                            <span className="text-4xl font-black text-gray-900">{stats.total}</span>
                        </div>
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm flex flex-col items-center justify-center transition-transform hover:scale-105">
                            <span className="text-green-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2"><UserCheck size={16} /> Présents</span>
                            <span className="text-4xl font-black text-green-700">{stats.present}</span>
                        </div>
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col items-center justify-center transition-transform hover:scale-105">
                            <span className="text-red-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2"><XCircle size={16} /> Absents</span>
                            <span className="text-4xl font-black text-red-700">{stats.absent}</span>
                        </div>
                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm flex flex-col items-center justify-center transition-transform hover:scale-105">
                            <span className="text-amber-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2"><AlertTriangle size={16} /> En retard</span>
                            <span className="text-4xl font-black text-amber-700">{stats.late || 0}</span>
                        </div>
                    </div>

                    <Card className="shadow-sm flex-1 border-gray-100" padding="p-0">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50 font-bold text-gray-800 flex items-center gap-2 px-6">
                            <Clock size={20} className="text-orange-500" />
                            Activité des Superviseurs (Derniers enregistrements)
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {recentLogs.map((log: any) => (
                                    <div key={log.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-xl border border-gray-100 hover:bg-orange-50/30 transition-colors gap-4">
                                        <div>
                                            <div className="font-bold text-gray-900 text-base mb-1.5">{log.schedule?.teacher}</div>
                                            <div className="text-sm font-medium text-gray-500">
                                                {log.schedule?.class} <span className="text-gray-300 mx-2">|</span> <span className="text-orange-600/80">Superviseur: {log.user_name || 'Inconnu'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:items-end w-full sm:w-auto">
                                            <span className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm w-fit ${
                                                log.status === 'present' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                log.status === 'absent' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                log.status === 'late' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                'bg-blue-100 text-blue-700 border border-blue-200'
                                            }`}>
                                                {log.status === 'present' ? 'Présent' : log.status === 'absent' ? 'Absent' : log.status === 'late' ? 'Retard' : 'Motif'}
                                            </span>
                                            <span className="text-xs font-bold text-gray-400 mt-2 flex items-center gap-1.5">
                                                <Clock size={12} />
                                                {new Date(log.recorded_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {recentLogs.length === 0 && (
                                    <div className="text-center py-12 text-gray-400 text-sm font-medium">
                                        Aucun enregistrement récent
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default LiveDashboardPage;
