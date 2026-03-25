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
    const { i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    
    const [logs, setLogs] = useState<ActionLog[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterSubject, setFilterSubject] = useState<string>('all');
    const [filterClass, setFilterClass] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

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
            case 'present': return { icon: CheckCircle, text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Présent à l\'heure' };
            case 'absent':  return { icon: XCircle, text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Absent' };
            case 'late':    return { icon: AlertTriangle, text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'En retard' };
            case 'excused': return { icon: MessageSquare, text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Excusé' };
            default:        return { icon: Clock, text: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', label: status };
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
        const matchesSubject = filterSubject === 'all' || log.schedule?.subject === filterSubject;
        const matchesClass = filterClass === 'all' || log.schedule?.class === filterClass;
        const matchesSearch = log.schedule?.teacher?.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesStatus && matchesSubject && matchesClass && matchesSearch;
    });

    const formatTime = (time: string | undefined) => time?.slice(0, 5) || '—';

    return (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col ${className}`}>
            {/* ── Entête & Filtres Avancés ── */}
            <div className={`px-4 py-3 flex flex-col gap-3 border-b border-gray-100 bg-slate-50/50 rounded-t-2xl ${isRtl ? 'text-right' : ''}`}>
                
                {/* Ligne 1 : Titre et Date Picker */}
                <div className={`flex flex-col md:flex-row justify-between items-center gap-3 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-2 w-full md:w-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <div className="p-1.5 bg-orange-100 rounded-lg">
                            <History size={16} className="text-orange-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-base leading-tight">Journal des Saisies</h2>
                            <p className="text-[10px] text-gray-500 font-medium leading-tight">{logs.length} action(s) ce jour</p>
                        </div>
                    </div>
                    
                    <div className="relative w-full md:w-auto">
                        <Calendar className={`absolute top-2 text-gray-400 ${isRtl ? 'right-2.5' : 'left-2.5'}`} size={14} />
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className={`w-full md:w-auto py-1.5 bg-white border border-gray-200 text-xs font-bold text-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer ${isRtl ? 'pr-8 pl-3 text-right' : 'pl-8 pr-3'}`}
                        />
                    </div>
                </div>

                {/* Ligne 2 : Filtres (Recherche, Status, Matière, Classe) */}
                <div className={`grid grid-cols-1 md:grid-cols-4 gap-2 mt-1 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                    
                    <div className="relative">
                        <Search className={`absolute top-2 text-gray-400 ${isRtl ? 'right-2.5' : 'left-2.5'}`} size={14} />
                        <input
                            type="text"
                            placeholder="Rechercher un prof..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full py-1.5 bg-white border border-gray-200 text-xs font-medium rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${isRtl ? 'pr-8 pl-3 text-right' : 'pl-8 pr-3'}`}
                        />
                    </div>

                    <select 
                        value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
                        className={`w-full py-1.5 px-2.5 bg-white border border-gray-200 text-xs font-medium rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${isRtl ? 'text-right' : ''}`}
                    >
                        <option value="all">Sujet (Tous)</option>
                        {uniqueSubjects.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
                    </select>

                    <select 
                        value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
                        className={`w-full py-1.5 px-2.5 bg-white border border-gray-200 text-xs font-medium rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${isRtl ? 'text-right' : ''}`}
                    >
                        <option value="all">Classe (Toutes)</option>
                        {uniqueClasses.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                    </select>
                    
                    {/* Status Pill Menu */}
                    <select
                        value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        className={`w-full py-1.5 px-2.5 bg-white border border-gray-200 text-xs font-bold text-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${isRtl ? 'text-right' : ''}`}
                    >
                        <option value="all">Statut (Tous)</option>
                        <option value="present">Présent à l'heure</option>
                        <option value="late">En retard</option>
                        <option value="absent">Absent</option>
                    </select>
                </div>
            </div>

            {/* ── Liste Moderne (Remplaçant le tableau HTML) ── */}
            <div className={`flex-1 overflow-y-auto bg-slate-50/50 p-2 sm:p-3 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
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
                            <p className="font-bold text-sm text-slate-600">Aucune saisie trouvée</p>
                            <p className="text-[10px] mt-1 text-slate-500">Essayez de changer la date ou les filtres.</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => {
                            const sc = getStatusConfig(log.status);
                            const Icon = sc.icon;
                            const recTime = new Date(log.recorded_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                            
                            return (
                                <div key={log.id} className={`bg-white border border-gray-100 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-orange-300 hover:shadow-sm transition-all group ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
                                    
                                    {/* Left: Avatar & Info */}
                                    <div className={`flex items-center gap-3 w-full sm:w-1/3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sc.bg} ${sc.text} shadow-sm border ${sc.border}`}>
                                            <Icon size={16} />
                                        </div>
                                        <div className={`min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
                                            <h3 className="font-bold text-slate-800 text-xs sm:text-sm truncate">{log.schedule?.teacher}</h3>
                                            <div className={`flex items-center gap-1.5 mt-0.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <p className="font-semibold text-slate-500 text-[10px] truncate">{log.schedule?.subject}</p>
                                                <span className="text-[8px] font-black uppercase text-orange-600 bg-orange-50 px-1.5 py-[1px] rounded flex-shrink-0 border border-orange-100">
                                                    {log.schedule?.class}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Times */}
                                    <div className={`flex items-center justify-center gap-3 py-1.5 px-3 rounded-lg border border-slate-100 bg-slate-50 w-full sm:w-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <span className="font-mono text-[10px] font-bold text-slate-500" dir="ltr">
                                            {formatTime(log.schedule?.time_start)}-{formatTime(log.schedule?.time_end)}
                                        </span>
                                        
                                        <div className="w-[1px] h-4 bg-slate-200"></div>

                                        <div className="flex items-center gap-1.5">
                                            <Clock size={11} className="text-orange-400" />
                                            <span className="font-mono text-xs font-black text-slate-700" dir="ltr">{recTime}</span>
                                        </div>
                                    </div>

                                    {/* Right: Status Badge */}
                                    <div className={`flex items-center sm:justify-end gap-2 w-full sm:w-1/4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border ${sc.bg} ${sc.border} ${sc.text} shadow-sm`}>
                                            <span className="text-[10px] font-bold tracking-wide uppercase">{sc.label}</span>
                                        </div>
                                        {log.reason && (
                                            <p className={`text-[9px] text-gray-400 italic max-w-[80px] truncate ${isRtl ? 'text-left' : 'text-right'}`} title={log.reason}>
                                                {log.reason}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            
            <div className="p-3 border-t border-gray-100 bg-gray-50/80 text-center rounded-b-2xl">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{filteredLogs.length} Entrée(s) Affichée(s)</p>
            </div>
        </div>
    );
};

export default ActionHistoryPanel;
