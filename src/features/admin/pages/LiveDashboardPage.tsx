import { useState, useEffect } from 'react';
import { Layout } from '../../../shared/components/layout/Layout';
import { realtimeService } from '../../../services/supabase/realtime.service';
import Card from '../../../shared/components/ui/Card';
import { Clock, Activity, AlertTriangle, UserCheck, XCircle, Users } from 'lucide-react';
import { adminService } from '../../../services/supabase/admin.service';

export const LiveDashboardPage = () => {
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, recorded: 0, rate: 0 });
    const [weeks, setWeeks] = useState<any[]>([]);
    const [selectedDay, setSelectedDay] = useState(() => {
        const daysFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return daysFr[new Date().getDay()];
    });
    const [selectedWeek, setSelectedWeek] = useState('all');

    useEffect(() => {
        const initWeeks = async () => {
            try {
                const weeksData = await adminService.getWeeksWithCounts();
                setWeeks(weeksData);
                if (weeksData.length > 0 && selectedWeek === 'all') {
                    setSelectedWeek(weeksData[0].id);
                }
            } catch (err) {
                console.error(err);
            }
        };
        initWeeks();
    }, []);

    useEffect(() => {
        // Load data whenever filters change
        loadData();

        // Subscribe to attendance live changes
        const attendSub = realtimeService.subscribeToAttendanceLive(() => {
            loadData();
        });

        return () => {
            attendSub?.unsubscribe();
        };
    }, [selectedDay, selectedWeek]);

    const loadData = async () => {
        try {
            const [alertsData, statsData] = await Promise.all([
                adminService.getLiveAlerts({ day: selectedDay, weekId: selectedWeek }),
                adminService.getGlobalStats({ day: selectedDay, weekId: selectedWeek })
            ]);

            setRecentLogs(alertsData);
            setStats(statsData);
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
                            <Activity className="text-orange-500 animate-pulse" /> Suivi & Alertes en Direct
                        </h2>
                        <p className="text-gray-500 mt-2 font-medium">Surveillance en temps réel des présences et des absences.</p>
                    </div>
                </div>

                {/* Filters & Progress */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex-1 w-full">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="font-bold text-gray-500 uppercase tracking-wider">Progression des Enregistrements</span>
                                <span className="font-black text-gray-900">{stats.recorded} / {stats.total} séances</span>
                            </div>
                            <div className="h-3 rounded-full bg-gray-100 overflow-hidden border border-gray-50 shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000 shadow-sm relative"
                                    style={{ width: `${stats.total > 0 ? (stats.recorded / stats.total) * 100 : 0}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Semaine</label>
                                <select
                                    value={selectedWeek}
                                    onChange={(e) => setSelectedWeek(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all font-bold text-gray-700 min-w-[160px] cursor-pointer"
                                >
                                    <option value="all">Toutes les semaines</option>
                                    {weeks.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Jour</label>
                                <select
                                    value={selectedDay}
                                    onChange={(e) => setSelectedDay(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all font-bold text-gray-700 min-w-[140px] cursor-pointer"
                                >
                                    <option value="all">Tous les jours</option>
                                    {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 flex flex-col">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100 shadow-sm flex flex-col items-center justify-center transition-transform hover:scale-105">
                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2 text-center">
                                {selectedDay === 'all' ? 'Séances (Semaine)' : `Séances : ${selectedDay}`}
                            </span>
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
                            <span className="text-amber-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2"><AlertTriangle size={16} /> Retard</span>
                            <span className="text-4xl font-black text-amber-700">{stats.late || 0}</span>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center transition-transform hover:scale-105">
                            <span className="text-blue-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2"><Users size={16} /> Taux</span>
                            <span className="text-4xl font-black text-blue-700">{stats.rate}%</span>
                        </div>
                    </div>

                    <Card className="shadow-sm flex-1 border-gray-100" padding="p-0">
                        <div className="p-5 border-b border-gray-100 bg-red-50/50 font-bold text-red-800 flex items-center gap-2 px-6 text-sm uppercase tracking-wide">
                            <AlertTriangle size={20} className="text-red-500 animate-pulse" />
                            Alertes : {selectedDay === 'all' ? 'Toute la Semaine' : selectedDay}
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {recentLogs.map((log: any) => (
                                    <div key={log.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-xl border border-gray-100 hover:bg-orange-50/30 transition-colors gap-4">
                                        <div>
                                            <div className="font-bold text-gray-900 text-base mb-1.5">{log.schedule?.teacher}</div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium">
                                                <span className="text-gray-500">{log.schedule?.class}</span>
                                                <span className="text-gray-300">|</span>
                                                {/* <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-100/50">Responsable: {log.assigned_supervisors}</span> */}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 italic">
                                                Signalé par: {log.user_name}
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:items-end w-full sm:w-auto">
                                            <span className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm w-fit ${log.status === 'present' ? 'bg-green-100 text-green-700 border border-green-200' :
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
