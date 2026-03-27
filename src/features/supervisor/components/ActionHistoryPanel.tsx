import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../services/supabase/client';
import { useAuth } from '../../auth/hooks/useAuth';
import { Clock, CheckCircle, XCircle, AlertTriangle, MessageSquare, History, Search, Filter, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ActionLog {
    id: string;
    schedule_id: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    recorded_at: string;
    reason: string | null;
    schedule: {
        teacher: string;
        subject: string;
        class: string;
        time_start: string;
        time_end: string;
    };
}

export const ActionHistoryPanel = ({ className = '' }: { className?: string }) => {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    
    const [logs, setLogs] = useState<ActionLog[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterSubject, setFilterSubject] = useState<string>('all');
    const [filterClass, setFilterClass] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const fetchHistory = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const targetDate = new Date(selectedDate);
            targetDate.setHours(0, 0, 0, 0);
            const nextDate = new Date(targetDate);
            nextDate.setDate(nextDate.getDate() + 1);

            let query = supabase
                .from('attendance_logs')
                .select(`
                    id, 
                    schedule_id, 
                    status, 
                    recorded_at, 
                    reason,
                    schedule:schedules!inner(teacher, subject, class, time_start, time_end, pointer)
                `)
                .gte('recorded_at', targetDate.toISOString())
                .lt('recorded_at', nextDate.toISOString())
                .order('recorded_at', { ascending: false });

            // On filtre pour que le superviseur ne voit que SES classes
            if (user?.role === 'supervisor' && user?.name) {
                query = query.eq('schedule.pointer', user.name);
            }

            const { data, error } = await query;

            if (error) throw error;

            const cleanData = (data as any[] || []).map(log => ({
                ...log,
                schedule: Array.isArray(log.schedule) ? log.schedule[0] : log.schedule
            }));

            setLogs(cleanData);
        } catch (err) {
            console.error('Erreur chargement historique:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.role, user?.name, selectedDate]);

    useEffect(() => {
        fetchHistory();
        const channel = supabase
            .channel('history_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_logs' }, fetchHistory)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchHistory]);

    // Extraire les classes et matières uniques pour les listes déroulantes
    const uniqueClasses = useMemo(() => Array.from(new Set(logs.map(l => l.schedule?.class))).filter(Boolean).sort(), [logs]);
    const uniqueSubjects = useMemo(() => Array.from(new Set(logs.map(l => l.schedule?.subject))).filter(Boolean).sort(), [logs]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'present': return { icon: CheckCircle, text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', label: t('supervisor.actionHistoryPanel.present') };
            case 'absent':  return { icon: XCircle, text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', label: t('supervisor.actionHistoryPanel.absent') };
            case 'late':    return { icon: AlertTriangle, text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: t('supervisor.actionHistoryPanel.late') };
            case 'excused': return { icon: MessageSquare, text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', label: t('supervisor.actionHistoryPanel.excused') };
            default:        return { icon: Clock, text: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', label: status };
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
        const matchesSubject = filterSubject === 'all' || log.schedule?.subject === filterSubject;
        const matchesClass = filterClass === 'all' || log.schedule?.class === filterClass;
        const matchesSearch = log.schedule?.teacher?.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesStatus && matchesSubject && matchesClass && matchesSearch;
    });



    return (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>
            {/* ── Entête & Filtres Avancés ── */}
            <div className="px-4 py-3 flex flex-col gap-3 border-b border-gray-100 bg-slate-50/50 rounded-t-2xl text-start">
                
                {/* Ligne 1 : Titre et Date Picker */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                    <div className="flex items-center justify-between w-full md:w-auto">
                        <div className="flex items-center gap-2 text-start">
                            <div className="p-1.5 bg-orange-100 rounded-lg">
                                <History size={16} className="text-orange-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900 text-base leading-tight">{t('supervisor.actionHistoryPanel.title')}</h2>
                                <p className="text-[10px] text-gray-500 font-medium leading-tight">{t('supervisor.actionHistoryPanel.actionsCount', { count: logs.length })}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowMobileFilters(!showMobileFilters)} 
                            className="md:hidden flex items-center justify-center p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all active:scale-90"
                        >
                            <Filter size={16} className={showMobileFilters ? "text-orange-500" : "text-gray-400"} />
                        </button>
                    </div>
                    
                    <div className={`relative w-full md:w-auto transition-all duration-300 ${showMobileFilters ? 'opacity-100' : 'hidden md:block'}`}>
                        <Calendar className="absolute top-3 text-orange-400 rtl:right-3 ltr:left-3" size={14} />
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full md:w-auto py-2.5 bg-white border border-gray-100 text-xs font-black text-gray-700 rounded-xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 cursor-pointer rtl:pr-9 rtl:pl-4 ltr:pl-9 ltr:pr-4 shadow-sm text-start transition-all"
                        />
                    </div>
                </div>

                {/* Ligne 2 : Filtres (Recherche, Status, Matière, Classe) */}
                <div className={`grid-cols-1 md:grid-cols-4 gap-2 mt-1 md:mt-1 ${showMobileFilters ? 'grid' : 'hidden md:grid'}`}>
                    
                    <div className="relative">
                        <Search className="absolute top-3 text-gray-400 rtl:right-3 ltr:left-3" size={14} />
                        <input
                            type="text"
                            placeholder={t('supervisor.actionHistoryPanel.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-2.5 bg-white border border-gray-100 text-xs font-bold rounded-xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 rtl:pr-9 rtl:pl-4 ltr:pl-9 ltr:pr-4 shadow-sm text-start transition-all placeholder:text-gray-300"
                        />
                    </div>

                    <select 
                        value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
                        className="w-full py-2.5 px-3 bg-white border border-gray-100 text-xs font-bold text-gray-600 rounded-xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 shadow-sm text-start appearance-none cursor-pointer"
                    >
                        <option value="all">{t('supervisor.actionHistoryPanel.subjectAll')}</option>
                        {uniqueSubjects.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
                    </select>

                    <select 
                        value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
                        className="w-full py-2.5 px-3 bg-white border border-gray-100 text-xs font-bold text-gray-600 rounded-xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 shadow-sm text-start appearance-none cursor-pointer"
                    >
                        <option value="all">{t('supervisor.actionHistoryPanel.classAll')}</option>
                        {uniqueClasses.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                    </select>
                    
                    <select
                        value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full py-2.5 px-3 bg-white border border-gray-100 text-xs font-black text-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 shadow-sm text-start appearance-none cursor-pointer"
                    >
                        <option value="all">{t('supervisor.actionHistoryPanel.statusAll')}</option>
                        <option value="present">{t('supervisor.actionHistoryPanel.present')}</option>
                        <option value="late">{t('supervisor.actionHistoryPanel.late')}</option>
                        <option value="absent">{t('supervisor.actionHistoryPanel.absent')}</option>
                    </select>
                </div>
            </div>

            {/* ── Liste Moderne (Remplaçant le tableau HTML) ── */}
            <div className="bg-slate-50/50 p-2 sm:p-3">
                <div className="space-y-2">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="animate-pulse bg-white border border-gray-100 rounded-xl p-3 flex gap-3 items-center">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                                    <div className="h-2 bg-gray-50 rounded w-1/5"></div>
                                </div>
                            </div>
                        ))
                    ) : filteredLogs.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                            <Filter size={24} className="mx-auto mb-3 text-gray-300" />
                            <p className="font-bold text-sm text-slate-600">{t('supervisor.actionHistoryPanel.noRecords')}</p>
                            <p className="text-[10px] mt-1 text-slate-500">{t('supervisor.actionHistoryPanel.tryChangingFilters')}</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => {
                            const sc = getStatusConfig(log.status);
                            const Icon = sc.icon;
                            const timeStart = log.schedule?.time_start?.slice(0, 5) || '—';
                            const timeEnd = log.schedule?.time_end?.slice(0, 5) || '—';
                            const recTime = new Date(log.recorded_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                            
                            // Parse reason to separate delay from motive if possible
                            let delayPart = '';
                            let motivePart = log.reason || '';
                            const latePrefixAr = t('supervisor.currentSessionCard.late', { lng: 'ar' });
                            const latePrefixFr = t('supervisor.currentSessionCard.late', { lng: 'fr' });
                            
                            if (log.reason && (log.reason.startsWith(latePrefixAr) || log.reason.startsWith(latePrefixFr))) {
                                const parts = log.reason.split(' - ');
                                if (parts.length > 0) {
                                    delayPart = parts[0];
                                    
                                    // RE-FORMAT DELAY if it's in raw minutes (e.g. "86 دقائق" -> "ساعة و 26 دقيقة")
                                    const minMatch = delayPart.match(/(\d+)/);
                                    if (minMatch && !delayPart.includes(t('supervisor.currentSessionCard.hour', { lng: 'fr' })) && !delayPart.includes(t('supervisor.currentSessionCard.hour', { lng: 'ar' }))) {
                                        const totalMins = parseInt(minMatch[1]);
                                        if (totalMins >= 60) {
                                            const h = Math.floor(totalMins / 60);
                                            const m = totalMins % 60;
                                            const isRtl = i18n.language === 'ar';
                                            
                                            let hrT = "";
                                            if (isRtl) {
                                                if (h === 1) hrT = t('supervisor.currentSessionCard.hour');
                                                else if (h === 2) hrT = "ساعتان";
                                                else hrT = `${h} ${t('supervisor.currentSessionCard.hour')}`;
                                            } else {
                                                hrT = `${h} ${t('supervisor.currentSessionCard.hour')}${h > 1 ? 's' : ''}`;
                                            }
                                            
                                            const andT = t('supervisor.currentSessionCard.and');
                                            const minT = t('supervisor.currentSessionCard.minutes');
                                            
                                            const latePrefix = log.reason.startsWith(latePrefixAr) ? latePrefixAr : latePrefixFr;
                                            
                                            if (m === 0) delayPart = `${latePrefix} ${hrT}`;
                                            else delayPart = `${latePrefix} ${hrT} ${andT} ${m} ${minT}`;
                                        }
                                    }
                                    
                                    motivePart = parts.slice(1).join(' - ');
                                }
                            }

                            return (
                                <div key={log.id} 
                                    className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col gap-3 hover:border-orange-200 transition-all shadow-sm active:scale-[0.99] ltr:text-left rtl:text-right"
                                >
                                    {/* Top: Teacher & Status */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sc.bg} ${sc.text} border ${sc.border}`}>
                                                <Icon size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-slate-800 text-sm truncate uppercase tracking-tight">{log.schedule?.teacher}</h3>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase">
                                                        {log.schedule?.class}
                                                    </span>
                                                    <p className="text-[10px] font-medium text-slate-500 truncate">{log.schedule?.subject}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border shadow-sm ${sc.bg} ${sc.text} ${sc.border}`}>
                                                {sc.label}
                                            </div>
                                            <span className="font-mono text-[10px] font-bold text-slate-400">{recTime}</span>
                                        </div>
                                    </div>

                                    {/* Bottom Info: Delay & Reason - Cleaned up */}
                                    {(delayPart || motivePart) && (
                                        <div className="space-y-1.5 pt-2 border-t border-gray-50">
                                            {delayPart && (
                                                <div className="flex items-center gap-2">
                                                    <Clock size={11} className="text-amber-400" />
                                                    <p className="text-[11px] font-bold text-amber-600">{delayPart}</p>
                                                </div>
                                            )}
                                            {motivePart && (
                                                <div className="flex items-start gap-2">
                                                    <div className="mt-1 flex-shrink-0 text-slate-300">
                                                        <MessageSquare size={11} />
                                                    </div>
                                                    <p className="text-[11px] font-medium text-slate-600 leading-normal italic bg-slate-50/50 p-1.5 rounded-lg w-full">
                                                        {motivePart}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Slot info */}
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{t('supervisor.actionHistoryPanel.slot')}</span>
                                        <span className="font-mono text-[10px] font-bold text-slate-300" dir="ltr">{timeStart} — {timeEnd}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            
            <div className="p-3 border-t border-gray-100 bg-gray-50/80 text-center rounded-b-2xl">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('supervisor.actionHistoryPanel.entriesShown', { count: filteredLogs.length })}</p>
            </div>
        </div>
    );
};

export default ActionHistoryPanel;
