import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../../shared/components/layout/Layout';
import Card from '../../../shared/components/ui/Card';
import Badge from '../../../shared/components/ui/Badge';
import { getAttendanceLogs } from '../../../services/supabase/attendance.service';
import { formatDate, formatTime } from '../../../shared/utils/formatters';
import { Search, Download, FileText, Calendar, Clock, CheckCircle2, UserX, BookOpen, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AttendanceLog } from '../../../types';

export const ReportsPage = () => {
    const { t } = useTranslation();
    // TABS: daily, weekly, history
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'history'>('daily');
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Load data based on active tab requirements
    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const now = new Date();
                let fromDate: string | undefined = undefined;
                let toDate: string | undefined = undefined;

                if (activeTab === 'daily') {
                    // Start of today
                    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                    fromDate = start.toISOString();
                    toDate = end.toISOString();
                } else if (activeTab === 'weekly') {
                    // Start of current week (Monday)
                    const dayOfWeek = now.getDay();
                    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    
                    const start = new Date(now);
                    start.setDate(now.getDate() - diffToMonday);
                    start.setHours(0, 0, 0, 0);
                    
                    const end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    end.setHours(23, 59, 59, 999);
                    
                    fromDate = start.toISOString();
                    toDate = end.toISOString();
                }

                // Pour "history", on laisse undefined pour tout récupérer (ou avec le limit normal)
                const data = await getAttendanceLogs(
                    activeTab === 'history' ? { limit: 200 } : { fromDate, toDate, limit: 1000 }
                );
                
                setLogs(data);
            } catch (error) {
                console.error('Error fetching logs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [activeTab]);

    // Derived Statistics (Numerical only)
    const currentStats = useMemo(() => {
        const total = logs.length;
        const presents = logs.filter(l => l.status === 'present').length;
        const absents = logs.filter(l => l.status === 'absent').length;
        const lates = logs.filter(l => l.status === 'late').length;
        const rate = total > 0 ? Math.round((presents / total) * 100) : 0;

        return { total, presents, absents, lates, rate };
    }, [logs]);

    const filteredLogs = logs.filter(log =>
        log.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.class_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportToExcel = () => {
        const dataToExport = filteredLogs.map(log => ({
            [t('admin.reports.table.date')]: formatDate(log.created_at),
            [t('admin.reports.table.time')]: formatTime(log.created_at),
            [t('admin.reports.table.supervisor')]: log.user_name,
            [t('admin.reports.table.teacher')]: log.teacher_name,
            [t('admin.reports.table.subject')]: log.subject,
            'Classe': log.class_name,
            [t('admin.reports.table.status')]: log.status === 'present' ? t('admin.reports.status.present') : log.status === 'absent' ? t('admin.reports.status.absent') : log.status === 'late' ? t('admin.reports.status.late') : t('admin.reports.status.excused')
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rapport Presences");
        XLSX.writeFile(wb, `Rapport_${activeTab}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`);
    };

    // --- Renderer: TABLE LIST ---
    const renderTableList = () => (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
        <thead className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                    <tr>
                        <th scope="col" className="px-4 py-3 font-black tracking-widest">{t('admin.reports.table.date')}</th>
                        <th scope="col" className="px-4 py-3 font-black tracking-widest">{t('admin.reports.table.time')}</th>
                        <th scope="col" className="px-4 py-3 font-black tracking-widest">{t('admin.reports.table.teacher')}</th>
                        <th scope="col" className="px-4 py-3 font-black tracking-widest">{t('admin.reports.table.classSubject')}</th>
                        <th scope="col" className="px-4 py-3 font-black tracking-widest">{t('admin.reports.table.supervisor')}</th>
                        <th scope="col" className="px-4 py-3 font-black tracking-widest">{t('admin.reports.table.status')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, idx) => (
                            <tr key={idx} className="bg-white animate-pulse">
                                <td className="px-4 py-3"><div className="h-3 bg-gray-50 rounded w-20"></div></td>
                                <td className="px-4 py-3"><div className="h-3 bg-gray-50 rounded w-12"></div></td>
                                <td className="px-4 py-3"><div className="h-3 bg-gray-50 rounded w-24"></div></td>
                                <td className="px-4 py-3"><div className="h-3 bg-gray-50 rounded w-32"></div></td>
                                <td className="px-4 py-3"><div className="h-3 bg-gray-50 rounded w-20"></div></td>
                                <td className="px-4 py-3"><div className="h-5 bg-gray-50 rounded-xl w-16"></div></td>
                            </tr>
                        ))
                    ) : filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                            <tr key={log.id} className="bg-white hover:bg-gray-50/50 transition-colors group border-b border-gray-50">
                                <td className="px-4 py-2.5 font-bold text-gray-400 whitespace-nowrap text-[11px]">{formatDate(log.created_at)}</td>
                                <td className="px-4 py-2.5 text-gray-950 font-black text-[11px]" dir="ltr">{formatTime(log.created_at)}</td>
                                <td className="px-4 py-2.5 font-black text-gray-950 uppercase tracking-tight text-xs">{log.teacher_name}</td>
                                <td className="px-4 py-2.5">
                                    <div className="font-bold text-gray-950 text-xs uppercase tracking-tight">{log.class_name}</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{log.subject}</div>
                                </td>
                                <td className="px-4 py-2.5 text-gray-400 font-bold text-xs uppercase tracking-tight">{log.user_name}</td>
                                <td className="px-4 py-2.5">
                                    <Badge variant={log.status} className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-xl border-none">{log.status === 'present' ? t('admin.reports.status.present') : log.status === 'absent' ? t('admin.reports.status.absent') : log.status === 'late' ? t('admin.reports.status.late') : t('admin.reports.status.excused')}</Badge>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search size={24} className="text-gray-300" />
                                </div>
                                <h3 className="font-bold text-gray-600 mb-1">{t('admin.reports.noResults')}</h3>
                                <p className="text-gray-400 text-sm">{t('admin.reports.noDataPeriod')}</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <Layout>
            <div className="space-y-5 pb-12 animate-in fade-in duration-700" dir="ltr">
                {/* EN-TÊTE DU MODULE */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-100 p-4 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-950 border border-gray-100">
                            <FileText size={20} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-950 tracking-tight">{t('admin.reports.pageTitle')}</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                {activeTab === 'daily' ? t('admin.reports.subtitleToday') : 
                                 activeTab === 'weekly' ? t('admin.reports.subtitleWeek') : 
                                 t('admin.reports.subtitleHistory')}
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={exportToExcel} 
                        disabled={loading || filteredLogs.length === 0} 
                        className="bg-gray-900 hover:bg-black text-white disabled:bg-gray-100 disabled:text-gray-400 transition-all px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm relative z-10 active:scale-95"
                    >
                        <Download size={15} />
                        {t('admin.reports.exportBtn')}
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-white border-gray-100 shadow-sm p-3.5 rounded-3xl" padding="p-0">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{t('admin.reports.statTotalSessions')}</p>
                                <h3 className="text-xl font-black text-gray-950 tracking-tight">{currentStats.total}</h3>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                <BookOpen size={15} />
                            </div>
                        </div>
                    </Card>
                    
                    <Card className="bg-white border-gray-100 shadow-sm p-3.5 rounded-3xl" padding="p-0">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{t('admin.reports.statAttendanceRate')}</p>
                                <h3 className="text-xl font-black text-emerald-600 tracking-tight">{currentStats.rate}%</h3>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                <CheckCircle2 size={15} />
                            </div>
                        </div>
                    </Card>
 
                    <Card className="bg-white border-gray-100 shadow-sm p-3.5 rounded-3xl" padding="p-0">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{t('admin.reports.statAbsences')}</p>
                                <h3 className="text-xl font-black text-rose-600 tracking-tight">{currentStats.absents}</h3>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                                <UserX size={15} />
                            </div>
                        </div>
                    </Card>
 
                    <Card className="bg-white border-gray-100 shadow-sm p-3.5 rounded-3xl" padding="p-0">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{t('admin.reports.statLates')}</p>
                                <h3 className="text-xl font-black text-amber-600 tracking-tight">{currentStats.lates}</h3>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                <Clock size={15} />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* NAVIGATION TABS */}
                <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-fit border border-gray-100">
                    <button 
                        onClick={() => setActiveTab('daily')}
                        className={`flex-1 sm:flex-none flex items-center gap-2 justify-center px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'daily' ? 'bg-white text-gray-950 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Calendar size={13} /> {t('admin.reports.tabToday')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('weekly')}
                        className={`flex-1 sm:flex-none flex items-center gap-2 justify-center px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'weekly' ? 'bg-white text-gray-950 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <BarChart3 size={13} /> {t('admin.reports.tabWeek')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 sm:flex-none flex items-center gap-2 justify-center px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-gray-950 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <FileText size={13} /> {t('admin.reports.tabHistory')}
                    </button>
                </div>

                {/* SEARCH BAR (Always present) */}
                <div className="w-full md:w-80 relative">
                    <Search className="absolute ltr:left-3 rtl:right-3 top-2 text-gray-400" size={13} />
                    <input
                        placeholder={t('common.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full ltr:pl-8 ltr:pr-4 rtl:pr-8 rtl:pl-4 py-1.5 border border-gray-100 rounded-xl text-xs font-bold bg-white focus:ring-1 focus:ring-gray-200 focus:border-gray-400 transition-all outline-none"
                    />
                </div>

                {/* CONTENU DYNAMIQUE */}
                <Card padding="p-0" className="shadow-sm border-gray-100 overflow-hidden border rounded-3xl">
                    {renderTableList()}
                    <div className="p-3 border-t border-gray-50 bg-gray-50/50 font-bold text-[9px] uppercase tracking-widest text-gray-400 text-center">
                        {t('admin.reports.totalRecords', { count: filteredLogs.length })}
                    </div>
                </Card>
            </div>
        </Layout>
    );
};

export default ReportsPage;
