import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../../shared/components/layout/Layout';
import Card from '../../../shared/components/ui/Card';
import Button from '../../../shared/components/ui/Button';
import Input from '../../../shared/components/ui/Input';
import Badge from '../../../shared/components/ui/Badge';
import { getAttendanceLogs } from '../../../services/supabase/attendance.service';
import { formatDate, formatTime } from '../../../shared/utils/formatters';
import { Search, Download, FileText, Calendar, BarChart3, AlertTriangle, Users, BookOpen, UserX, Clock, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AttendanceLog } from '../../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

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

    // Derived Statistics
    const currentStats = useMemo(() => {
        const total = logs.length;
        const presents = logs.filter(l => l.status === 'present').length;
        const absents = logs.filter(l => l.status === 'absent').length;
        const lates = logs.filter(l => l.status === 'late').length;
        const rate = total > 0 ? Math.round((presents / total) * 100) : 0;

        // Group by teacher for absences
        const absentTeachers: Record<string, number> = {};
        logs.filter(l => l.status === 'absent' || l.status === 'late').forEach(l => {
            const name = l.teacher_name || t('admin.reports.table.teacher');
            absentTeachers[name] = (absentTeachers[name] || 0) + (l.status === 'absent' ? 1 : 0.5); // late = 0.5 absence
        });
        
        const topAbsents = Object.entries(absentTeachers)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Group by class 
        const impactedClasses: Record<string, number> = {};
        logs.filter(l => l.status === 'absent').forEach(l => {
            const className = l.class_name || t('admin.reports.table.classSubject');
            impactedClasses[className] = (impactedClasses[className] || 0) + 1;
        });
        const topClasses = Object.entries(impactedClasses)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return { total, presents, absents, lates, rate, topAbsents, topClasses };
    }, [logs]);

    // Chart Data Generation (Weekly Trend)
    const chartData = useMemo(() => {
        if (activeTab !== 'weekly') return [];
        const daysMap: Record<string, { presents: number, absents: number, lates: number }> = {};
        
        // Calculate start of week (Monday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - diffToMonday);

        // Initialiser les jours de la semaine (Lundi au Dimanche)
        for (let i = 0; i <= 6; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
            daysMap[dateStr] = { presents: 0, absents: 0, lates: 0 };
        }

        logs.forEach(l => {
            const d = new Date(l.created_at);
            const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
            if (daysMap[dateStr]) {
                if (l.status === 'present') daysMap[dateStr].presents += 1;
                if (l.status === 'absent') daysMap[dateStr].absents += 1;
                if (l.status === 'late') daysMap[dateStr].lates += 1;
            }
        });

        return Object.entries(daysMap).map(([name, counts]) => ({
            name,
            [t('admin.reports.status.present')]: counts.presents,
            [t('admin.reports.status.absent')]: counts.absents,
            [t('admin.reports.status.late')]: counts.lates
        }));
    }, [logs, activeTab]);


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

    // --- Renderer: DAILY & WEEKLY DASHBOARDS ---
    const renderDashboard = () => (
        <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-white to-blue-50/50 border-blue-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('admin.reports.statTotalSessions')}</p>
                            <h3 className="text-3xl font-black text-blue-700 mt-2">{currentStats.total}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                            <BookOpen size={24} />
                        </div>
                    </div>
                </Card>
                
                <Card className="bg-gradient-to-br from-white to-emerald-50/50 border-emerald-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('admin.reports.statAttendanceRate')}</p>
                            <h3 className="text-3xl font-black text-emerald-700 mt-2">{currentStats.rate}%</h3>
                        </div>
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                            <CheckCircle2 size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-white to-red-50/50 border-red-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('admin.reports.statAbsences')}</p>
                            <h3 className="text-3xl font-black text-red-700 mt-2">{currentStats.absents}</h3>
                        </div>
                        <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                            <UserX size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-white to-amber-50/50 border-amber-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('admin.reports.statLates')}</p>
                            <h3 className="text-3xl font-black text-amber-700 mt-2">{currentStats.lates}</h3>
                        </div>
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                            <Clock size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Graphique (Uniquement pour Hebdomadaire) */}
                {activeTab === 'weekly' && (
                    <Card className="lg:col-span-2 shadow-sm border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <BarChart3 className="text-orange-500" /> {t('admin.reports.chartTitle')}
                        </h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <Tooltip 
                                        cursor={{fill: '#F3F4F6'}} 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey={t('admin.reports.status.present')} fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey={t('admin.reports.status.absent')} fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey={t('admin.reports.status.late')} fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                )}

                {/* Top Absences */}
                <Card className={`${activeTab === 'weekly' ? 'lg:col-span-1' : 'lg:col-span-2'} shadow-sm border-gray-100`}>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-red-500" /> {t('admin.reports.topAbsentsTitle')}
                    </h3>
                    
                    {currentStats.topAbsents.length > 0 ? (
                        <div className="space-y-4">
                            {currentStats.topAbsents.map(([name, count], idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="font-bold text-gray-700">{name}</div>
                                    <div className="font-bold text-red-600 bg-red-100 px-3 py-1 rounded-lg">
                                        {t('admin.reports.absenceTimes', { count: count })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-xl text-gray-400 font-medium">
                            <CheckCircle2 size={32} className="mx-auto text-emerald-300 mb-2" />
                            {t('admin.reports.noAbsences')}
                        </div>
                    )}
                </Card>

                {/* Top Classes Impactées */}
                <Card className="lg:col-span-1 shadow-sm border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Users className="text-blue-500" /> {t('admin.reports.topClassesTitle')}
                    </h3>
                    
                    {currentStats.topClasses.length > 0 ? (
                        <div className="space-y-4">
                            {currentStats.topClasses.map(([className, count], idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="font-bold text-gray-700">{className}</div>
                                    <div className="font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-lg">
                                        {count} {t('admin.reports.sessionsSuffix')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-xl text-gray-400 font-medium">
                            {t('admin.reports.allClassesCovered')}
                        </div>
                    )}
                </Card>
            </div>

            {/* Quick Listing for Dashboard */}
            <Card className="shadow-sm border-gray-100 p-0 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-white">
                    <h3 className="text-lg font-bold text-gray-800">{t('admin.reports.latestRecords')}</h3>
                </div>
                {renderTableList()}
            </Card>
        </div>
    );


    // --- Renderer: HISTORY TABLE ---
    const renderTableList = () => (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="text-xs text-gray-500 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th scope="col" className="px-6 py-4 font-bold">{t('admin.reports.table.date')}</th>
                        <th scope="col" className="px-6 py-4 font-bold">{t('admin.reports.table.time')}</th>
                        <th scope="col" className="px-6 py-4 font-bold">{t('admin.reports.table.teacher')}</th>
                        <th scope="col" className="px-6 py-4 font-bold">{t('admin.reports.table.classSubject')}</th>
                        <th scope="col" className="px-6 py-4 font-bold">{t('admin.reports.table.supervisor')}</th>
                        <th scope="col" className="px-6 py-4 font-bold">{t('admin.reports.table.status')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, idx) => (
                            <tr key={idx} className="bg-white animate-pulse">
                                <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-40"></div></td>
                                <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-28"></div></td>
                                <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-lg w-20"></div></td>
                            </tr>
                        ))
                    ) : filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                            <tr key={log.id} className="bg-white hover:bg-orange-50/50 transition-colors group">
                                <td className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                                <td className="px-6 py-4 text-gray-400 font-mono font-bold" dir="ltr">{formatTime(log.created_at)}</td>
                                <td className="px-6 py-4 font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{log.teacher_name}</td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-700">{log.class_name}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">{log.subject}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 font-medium">{log.user_name}</td>
                                <td className="px-6 py-4">
                                    <Badge variant={log.status}>{log.status === 'present' ? t('admin.reports.status.present') : log.status === 'absent' ? t('admin.reports.status.absent') : log.status === 'late' ? t('admin.reports.status.late') : t('admin.reports.status.excused')}</Badge>
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
            <div className="flex flex-col gap-6 pb-12" dir="ltr">
                {/* EN-TÊTE DU MODULE */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-orange-50 to-white border border-orange-100 p-6 rounded-3xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl shadow-inner">
                            <FileText size={28} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t('admin.reports.pageTitle')}</h2>
                            <p className="text-sm font-medium text-gray-500 mt-1">
                                {activeTab === 'daily' ? t('admin.reports.subtitleToday') : 
                                 activeTab === 'weekly' ? t('admin.reports.subtitleWeek') : 
                                 t('admin.reports.subtitleHistory')}
                            </p>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={exportToExcel} 
                        disabled={loading || filteredLogs.length === 0} 
                        leftIcon={<Download size={18} />}
                        className="bg-gray-900 hover:bg-black text-white disabled:bg-gray-300 border-transparent shadow-lg shadow-gray-900/20 whitespace-nowrap rounded-xl font-bold"
                    >
                        {t('admin.reports.exportBtn')}
                    </Button>
                </div>

                {/* NAVIGATION TABS */}
                <div className="flex bg-gray-100/80 p-1.5 rounded-2xl w-full sm:w-fit border border-gray-200 shadow-inner">
                    <button 
                        onClick={() => setActiveTab('daily')}
                        className={`flex-1 sm:flex-none flex items-center gap-2 justify-center px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'daily' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                        <Calendar size={18} /> {t('admin.reports.tabToday')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('weekly')}
                        className={`flex-1 sm:flex-none flex items-center gap-2 justify-center px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'weekly' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                        <BarChart3 size={18} /> {t('admin.reports.tabWeek')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 sm:flex-none flex items-center gap-2 justify-center px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                        <FileText size={18} /> {t('admin.reports.tabHistory')}
                    </button>
                </div>

                {/* CONTENU DYNAMIQUE */}
                {activeTab === 'history' && (
                    <Card padding="p-0" className="shadow-sm border-gray-100 animate-fade-in overflow-hidden border">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center">
                            <div className="w-full md:w-96 relative">
                                <Input
                                    placeholder={t('admin.reports.searchPlaceholderHistory')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    leftIcon={<Search className="h-4 w-4 text-gray-400" />}
                                    className="bg-white border-gray-200 rounded-xl"
                                />
                            </div>
                        </div>
                        {renderTableList()}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50 font-medium text-xs text-gray-500 text-center">
                            {t('admin.reports.totalRecords', { count: filteredLogs.length })}
                        </div>
                    </Card>
                )}

                {activeTab !== 'history' && renderDashboard()}

            </div>
        </Layout>
    );
};

export default ReportsPage;
