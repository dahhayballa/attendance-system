import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../../shared/components/layout/Layout';
import { realtimeService } from '../../../services/supabase/realtime.service';
import { 
    Clock, Activity, 
    XCircle, Users, Download, 
    CheckCircle2, ChevronRight, Hash
} from 'lucide-react';
import { adminService } from '../../../services/supabase/admin.service';
import { useGlobalStats } from '../hooks/useGlobalStats';
import { StatsWidget } from '../components/StatsWidget';
import Papa from 'papaparse';
import { useToast } from '../../../shared/hooks/useToast';

export const LiveDashboardPage = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const weekDays = t('common.weekDays', { returnObjects: true }) as string[];
    
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [weeks, setWeeks] = useState<any[]>([]);
    const [selectedDay, setSelectedDay] = useState(() => {
        const day = new Date().getDay();
        const index = day === 0 ? 6 : day - 1;
        return weekDays[index] || 'all';
    });
    const [selectedWeek, setSelectedWeek] = useState('all');
    const [alertCount, setAlertCount] = useState(0);

    const getTimeRange = useCallback(() => {
        if (selectedDay === 'all') return {};

        let baseStart: Date;

        if (selectedWeek === 'all') {
            const now = new Date();
            const currentDayOfWeek = now.getDay();
            const diffToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
            baseStart = new Date(now);
            baseStart.setDate(now.getDate() - diffToMonday);
            baseStart.setHours(0, 0, 0, 0);
        } else {
            const targetWeek = weeks.find(w => w.id === selectedWeek);
            if (!targetWeek || !targetWeek.start_date) return {};
            baseStart = new Date(targetWeek.start_date);
            baseStart.setHours(0, 0, 0, 0);
        }

        const dayIndex = weekDays.indexOf(selectedDay);
        
        if (dayIndex !== -1) {
            const start = new Date(baseStart);
            start.setDate(start.getDate() + dayIndex);
            
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
            
            return {
                exactDateStart: start.toISOString(),
                exactDateEnd: end.toISOString()
            };
        }
        return {};
    }, [selectedDay, selectedWeek, weeks, weekDays]);

    const filters = { 
        day: selectedDay, 
        weekId: selectedWeek, 
        isLive: true, 
        ...getTimeRange() 
    };

    const { refetch } = useGlobalStats(filters);

    const loadData = useCallback(async () => {
        try {
            const timeRange = getTimeRange();
            const alertsData = await adminService.getLiveAlerts({ 
                day: selectedDay, 
                weekId: selectedWeek, 
                ...timeRange 
            });

            setRecentLogs(alertsData);
            // Count critical alerts (absences)
            const criticalOnes = alertsData.filter((l: any) => l.status === 'absent').length;
            setAlertCount(criticalOnes);
        } catch (error) {
            console.error(error);
        }
    }, [selectedDay, selectedWeek, getTimeRange]);

    useEffect(() => {
        const initWeeks = async () => {
            try {
                const weeksData = await adminService.getWeeksWithCounts();
                setWeeks(weeksData);
            } catch (err) {
                console.error(err);
            }
        };
        initWeeks();
    }, []);

    useEffect(() => {
        loadData();

        const attendSub = realtimeService.subscribeToAttendanceLive(() => {
            refetch(); // Refresh KPIs
            loadData(); // Refresh Timeline
        });

        return () => {
            attendSub?.unsubscribe();
        };
    }, [selectedDay, selectedWeek, refetch, loadData]);

    const handleExportCSV = () => {
        if (recentLogs.length === 0) {
            toast.error(t('admin.reports.noResults'));
            return;
        }
        
        const data = recentLogs.map(log => ({
            [t('admin.logs.colTime')]: new Date(log.recorded_at).toLocaleTimeString('fr-FR'),
            [t('admin.logs.colTeacher')]: log.schedule?.teacher,
            [t('admin.logs.colClass')]: log.schedule?.class,
            [t('admin.logs.colSubject')]: log.schedule?.subject,
            [t('admin.logs.colStatus')]: log.status === 'present' ? t('admin.liveDashboard.statusPresent') : log.status === 'absent' ? t('admin.liveDashboard.statusAbsent') : t('admin.liveDashboard.statusLate'),
            [t('admin.logs.colSupervisor')]: log.user_name
        }));

        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Live_Export_${selectedDay}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Layout>
            <div className="space-y-5 pb-12 animate-in fade-in duration-700" dir="ltr">
                
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900 border border-gray-100">
                            <Activity size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-950 tracking-tight">
                                {t('admin.liveDashboard.pageTitle')}
                                {alertCount > 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full align-middle shadow-sm">
                                        {alertCount}
                                    </span>
                                )}
                            </h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{t('admin.liveDashboard.pageSubtitle')}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 relative z-10 w-full md:w-auto">
                        <div className="flex-1 md:flex-none">
                            <select
                                value={selectedWeek}
                                onChange={(e) => setSelectedWeek(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-400 transition-all cursor-pointer"
                            >
                                <option value="all">{t('admin.liveDashboard.allWeeks')}</option>
                                {weeks.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 md:flex-none">
                            <select
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-400 transition-all cursor-pointer"
                            >
                                <option value="all">{t('admin.liveDashboard.allDays')}</option>
                                {weekDays.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={handleExportCSV}
                            className="p-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-sm flex items-center justify-center"
                            title={t('admin.logs.exportBtn')}
                        >
                            <Download size={15} />
                        </button>
                    </div>
                </div>

                {/* ── KPI Widgets (Compact) ── */}
                <StatsWidget filters={filters} showProgress={true} />

                {/* ── Timeline Feed ── */}
                <div className="grid grid-cols-1 gap-5">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-gray-900 text-white rounded-xl">
                                    <Clock size={13} />
                                </div>
                                <span className="font-black text-gray-950 text-[10px] uppercase tracking-widest">
                                    {t('admin.liveDashboard.reportedByTimeline', "Flux d'activité en direct")}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic animate-pulse">
                                {t('common.loading')} {/* Or a dedicated key for auto-update */}
                            </span>
                        </div>
                        <div className="p-4">
                            {recentLogs.length > 0 ? (
                                <div className="relative space-y-4 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-px before:bg-gray-100">
                                    {recentLogs.map((log) => (
                                        <div key={log.id} className="relative flex items-start gap-4 group">
                                            {/* Dot */}
                                            <div className={`mt-1.5 w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center relative z-10 transition-transform group-hover:scale-110 duration-300 ${
                                                log.status === 'present' ? 'bg-emerald-500' :
                                                log.status === 'absent' ? 'bg-rose-500' :
                                                log.status === 'late' ? 'bg-amber-500' : 'bg-blue-500'
                                            }`}>
                                                {log.status === 'present' ? <CheckCircle2 size={13} className="text-white" /> :
                                                 log.status === 'absent' ? <XCircle size={13} className="text-white" /> :
                                                 <Clock size={13} className="text-white" />}
                                            </div>
 
                                            {/* Content */}
                                            <div className="flex-1 bg-white p-3 rounded-2xl border border-gray-50 shadow-sm group-hover:bg-gray-50/50 transition-all duration-300">
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                    <div>
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">
                                                            {new Date(log.recorded_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <h4 className="font-black text-gray-950 text-xs uppercase tracking-tight">
                                                            {log.schedule?.teacher}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <span className="px-1.5 py-0.5 bg-gray-50 rounded-lg text-[9px] font-black text-gray-400 uppercase border border-gray-100 flex items-center gap-1">
                                                                <Hash size={9} /> {log.schedule?.class}
                                                            </span>
                                                            <span className="px-1.5 py-0.5 bg-gray-50 rounded-lg text-[9px] font-black text-gray-400 uppercase border border-gray-100">
                                                                {log.schedule?.subject}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                        <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                                            log.status === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                            log.status === 'absent' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                            log.status === 'late' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                        }`}>
                                                            {log.status === 'present' ? t('admin.liveDashboard.statusPresent') : 
                                                             log.status === 'absent' ? t('admin.liveDashboard.statusAbsent') : 
                                                             log.status === 'late' ? t('admin.liveDashboard.statusLate') : t('admin.liveDashboard.statusExcused')}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                                                            <Users size={10} />
                                                            {t('admin.liveDashboard.reportedByTimeline', 'Par')}: <span className="text-gray-950">{log.user_name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Shortcut Icon */}
                                            <div className="hidden sm:flex items-center self-center opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                                    <ChevronRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-gray-100">
                                    <Activity size={32} className="mx-auto text-gray-200 mb-4" />
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.liveDashboard.noRecords')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LiveDashboardPage;
