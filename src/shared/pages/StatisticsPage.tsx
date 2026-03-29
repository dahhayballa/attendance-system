import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useStatistics, GroupedStat } from '../hooks/useStatistics';
import { useRole } from '../../features/auth/hooks/useRole';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Swal from 'sweetalert2';
import SearchableSelect from '../components/ui/SearchableSelect';
import { 
    TrendingUp, 
    GraduationCap, 
    UserCheck, 
    ChevronRight, 
    BookOpen, 
    Info, 
    Filter, 
    Calendar,
    Clock, 
    AlertTriangle, 
    ChevronUp, 
    CheckCircle2, 
    XCircle
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
    Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

type ViewType = 'overview' | 'classes' | 'teachers' | 'subjects';

/**
 * Statistics Page - Advanced & Minimal Design
 * Incorporates informative tooltips for each statistic.
 */
export const StatisticsPage = () => {
    const { 
        kpis, rates, recentAlerts, byClass, byTeacher, bySubject, dailyTrend, timeframe, setTimeframe, 
        customDate, setCustomDate, loading, error, refetch, options, filters, setFilters 
    } = useStatistics();
    const { role } = useRole();
    const { t, i18n } = useTranslation();
    const [activeView, setActiveView] = useState<ViewType>('overview');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState<GroupedStat | null>(null);

    const resetFilters = () => {
        setFilters({
            teacher: 'all',
            subject: 'all',
            class: 'all'
        });
    };

    const showInfo = (title: string, content: string) => {
        Swal.fire({
            title: title,
            text: content,
            icon: 'info',
            confirmButtonText: 'OK',
            confirmButtonColor: '#000',
            customClass: {
                popup: 'rounded-3xl border-none shadow-2xl font-sans',
                title: 'text-xl font-black text-gray-950',
                htmlContainer: 'text-sm font-medium text-gray-500',
                confirmButton: 'rounded-xl px-10 py-3 font-bold text-sm tracking-widest'
            }
        });
    };

    const isInitialLoading = loading && dailyTrend.length === 0;

    if (isInitialLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-2 border-gray-100 border-t-black rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm font-medium animate-pulse">{t('common.loading')}</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-sm">
                    <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('error.defaultTitle')}</h3>
                    <p className="text-gray-500 mb-8">{error}</p>
                    <button onClick={refetch} className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all">
                        {t('error.retry')}
                    </button>
                </div>
            </Layout>
        );
    }

    const presenceData = [
        { name: 'Présent', value: rates.presenceRate, color: '#10b981' },
        { name: 'Absent', value: 100 - rates.presenceRate, color: '#f1f5f9' },
    ];

    const viewItems = activeView === 'classes' ? byClass : (activeView === 'teachers' ? byTeacher : bySubject);

    return (
        <Layout>
            <div className={`space-y-8 animate-in fade-in duration-700 font-sans relative ${loading && !isInitialLoading ? 'opacity-60 pointer-events-none transition-opacity' : ''}`}>
                {/* Subtle loading indicator at the top */}
                {loading && !isInitialLoading && (
                    <div className="fixed top-0 left-0 right-0 z-[200]">
                        <div className="h-1 bg-orange-500 animate-pulse w-full"></div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-black text-gray-950 tracking-tight flex items-center gap-2">
                             {t('supervisor.statisticsPage.title')} {activeView !== 'overview' && <><ChevronRight className="text-gray-300" /> {activeView === 'classes' ? t('supervisor.statisticsPage.tabs.classes') : activeView === 'teachers' ? t('supervisor.statisticsPage.tabs.teachers') : t('supervisor.statisticsPage.tabs.subjects')}</>}
                        </h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t('supervisor.statisticsPage.subtitle')} ({role})</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-start sm:justify-end w-full sm:w-auto">
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 flex-shrink-0">
                            {[
                                { id: 'overview', icon: <TrendingUp size={14} />, label: t('supervisor.statisticsPage.tabs.overview') },
                                { id: 'classes', icon: <GraduationCap size={14} />, label: t('supervisor.statisticsPage.tabs.classes') },
                                { id: 'teachers', icon: <UserCheck size={14} />, label: t('supervisor.statisticsPage.tabs.teachers') },
                                { id: 'subjects', icon: <BookOpen size={14} />, label: t('supervisor.statisticsPage.tabs.subjects') }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveView(tab.id as any)}
                                    title={tab.label}
                                    className={`p-2 px-3 rounded-lg transition-all ${activeView === tab.id ? 'bg-white shadow-sm text-black border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {tab.icon}
                                </button>
                            ))}
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 flex-shrink-0">
                            <button 
                                onClick={() => setTimeframe('day')}
                                className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${timeframe === 'day' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                {t('supervisor.statisticsPage.labels.day')}
                            </button>
                            <button 
                                onClick={() => setTimeframe('week')}
                                className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${timeframe === 'week' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                {t('supervisor.statisticsPage.labels.week')}
                            </button>
                            <button 
                                onClick={() => setTimeframe('month')}
                                className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${timeframe === 'month' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                {t('supervisor.statisticsPage.labels.month')}
                            </button>
                        </div>

                        {timeframe === 'day' && (
                            <div className="relative group">
                                <input 
                                    type="date"
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                                    onClick={(e: any) => e.currentTarget.showPicker?.()}
                                />
                                <div className="flex items-center gap-2 p-2 px-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-black transition-all">
                                    <Calendar size={14} className="text-gray-400 group-hover:text-black" />
                                    <span className="text-[10px] font-black text-gray-950">{new Date(customDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                                </div>
                            </div>
                        )}
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all border ${showFilters ? 'bg-orange-50 border-orange-100 text-orange-600 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Filter size={14} className={showFilters ? 'text-orange-500' : 'text-gray-400'} />
                            <span className="uppercase tracking-widest font-black leading-none">{t('supervisor.statisticsPage.labels.filters')}</span>
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 animate-in slide-in-from-top-4 duration-300">
                        <SearchableSelect 
                            placeholder={t('supervisor.statisticsPage.labels.teacher')}
                            icon={<UserCheck size={14} />}
                            allLabel={t('supervisor.statisticsPage.labels.allTeachers')}
                            options={options.teachers}
                            value={filters.teacher}
                            onChange={(val) => setFilters(prev => ({ ...prev, teacher: val }))}
                        />
                        <SearchableSelect 
                            placeholder={t('supervisor.statisticsPage.labels.subject')}
                            icon={<BookOpen size={14} />}
                            allLabel={t('supervisor.statisticsPage.labels.allSubjects')}
                            options={options.subjects}
                            value={filters.subject}
                            onChange={(val) => setFilters(prev => ({ ...prev, subject: val }))}
                        />
                        <SearchableSelect 
                            placeholder={t('supervisor.statisticsPage.labels.class')}
                            icon={<GraduationCap size={14} />}
                            allLabel={t('supervisor.statisticsPage.labels.allClasses')}
                            options={options.classes}
                            value={filters.class}
                            onChange={(val) => setFilters(prev => ({ ...prev, class: val }))}
                        />
                        <div className="flex items-end gap-2">
                             <button 
                                onClick={resetFilters}
                                className="flex-1 py-3.5 px-4 bg-white border border-gray-200 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                {t('supervisor.statisticsPage.labels.reset')}
                            </button>
                            <button 
                                onClick={() => setShowFilters(false)}
                                className="p-3.5 bg-gray-900 text-white rounded-2xl hover:bg-black w-14 flex items-center justify-center transition-colors shadow-lg active:scale-95"
                                title="Fermer"
                            >
                                <ChevronUp size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {activeView === 'overview' && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                            <SmallAdvancedCard 
                                icon={<GraduationCap size={18} />} 
                                label={t('supervisor.statisticsPage.kpi.totalSessions')} 
                                value={kpis.totalSessions} 
                                color="gray" 
                                info={t('supervisor.statisticsPage.charts.totalSessionsSub')}
                                onInfo={showInfo}
                            />
                            <SmallAdvancedCard 
                                icon={<CheckCircle2 size={18} />} 
                                label={t('supervisor.statisticsPage.kpi.totalPresent')} 
                                value={kpis.totalPresence} 
                                color="emerald" 
                                info={t('supervisor.statisticsPage.charts.presenceRepartitionSub')}
                                onInfo={showInfo}
                            />
                            <SmallAdvancedCard 
                                icon={<Clock size={14} />} 
                                label={t('supervisor.statisticsPage.kpi.onTime')} 
                                value={kpis.onTime} 
                                color="blue" 
                                info={t('supervisor.statisticsPage.charts.onTimeSub')}
                                onInfo={showInfo}
                            />
                            <SmallAdvancedCard 
                                icon={<AlertTriangle size={18} />} 
                                label={t('supervisor.statisticsPage.kpi.late')} 
                                value={kpis.late} 
                                color="amber" 
                                info={t('supervisor.statisticsPage.charts.lateSub')}
                                onInfo={showInfo}
                            />
                            <SmallAdvancedCard 
                                icon={<XCircle size={18} />} 
                                label={t('supervisor.statisticsPage.kpi.absent')} 
                                value={kpis.absent} 
                                color="rose" 
                                info={t('supervisor.statisticsPage.charts.absentSub')}
                                onInfo={showInfo}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <Card className="border-gray-100 h-full flex flex-col justify-between" padding="p-8">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <div className="flex items-center gap-2 group">
                                                <h3 className="text-lg font-bold text-gray-900">{t('supervisor.statisticsPage.charts.presenceEvolution')}</h3>
                                                <span 
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity cursor-help" 
                                                    title={t('supervisor.statisticsPage.charts.presenceEvolutionSub')}
                                                    onClick={() => showInfo(t('supervisor.statisticsPage.charts.presenceEvolution'), t('supervisor.statisticsPage.charts.presenceEvolutionSub'))}
                                                >
                                                    <Info size={14} className="text-gray-300 pointer-events-none" />
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                {timeframe === 'day' 
                                                    ? t('supervisor.statisticsPage.charts.activityDay') 
                                                    : t('supervisor.statisticsPage.charts.activityLabel', { count: timeframe === 'week' ? 7 : 30 })
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-64 mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={dailyTrend}>
                                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis 
                                                    dataKey="date" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                                                    tickFormatter={(str) => {
                                                        const d = new Date(str);
                                                        // Use the selected language locale (fr-FR or ar-SA)
                                                        const locale = i18n.language === 'ar' ? 'ar-SA' : 'fr-FR';
                                                        return d.toLocaleDateString(locale, { weekday: 'short' });
                                                    }}
                                                />
                                                <YAxis hide />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="presence" 
                                                    stroke="#0f172a" 
                                                    strokeWidth={3} 
                                                    fillOpacity={1} 
                                                    fill="transparent" 
                                                    name={t('supervisor.statisticsPage.modal.presenceRate')} 
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </div>

                            <Card className="border-gray-100" padding="p-8 text-center flex flex-col items-center justify-center">
                                <div className="flex items-center gap-2 group">
                                    <h3 className="text-lg font-bold text-gray-900">{t('supervisor.statisticsPage.charts.presenceRepartition')}</h3>
                                    <span 
                                        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-help" 
                                        title={t('supervisor.statisticsPage.charts.presenceRepartitionSub')}
                                        onClick={() => showInfo(t('supervisor.statisticsPage.charts.presenceRepartition'), t('supervisor.statisticsPage.charts.presenceRepartitionSub'))}
                                    >
                                        <Info size={14} className="text-gray-300 pointer-events-none" />
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t('supervisor.statisticsPage.charts.overallRate')}</p>
                                
                                <div className="h-64 w-full mt-4 relative flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={presenceData}
                                                cx="50%" cy="50%"
                                                innerRadius={75} outerRadius={95}
                                                paddingAngle={0} dataKey="value" stroke="none"
                                                startAngle={90} endAngle={450}
                                            >
                                                {presenceData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <p className="text-4xl font-black text-gray-950 tracking-tighter">{rates.presenceRate}%</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-widest">{t('supervisor.statisticsPage.kpi.totalPresent')}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <Card className="border-gray-50 flex-1 overflow-hidden flex flex-col" padding="p-8">
                                    <div className="flex items-center gap-2 group">
                                        <h3 className="text-lg font-bold text-gray-900">{t('supervisor.statisticsPage.charts.topPresence')}</h3>
                                        <span 
                                            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-help" 
                                            title={t('supervisor.statisticsPage.charts.topPresenceSub')}
                                            onClick={() => showInfo(t('supervisor.statisticsPage.charts.topPresence'), t('supervisor.statisticsPage.charts.topPresenceSub'))}
                                        >
                                            <Info size={14} className="text-gray-300 pointer-events-none" />
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 mb-8">
                                        {t('supervisor.statisticsPage.modal.presenceRate')} {t('supervisor.statisticsPage.labels.byClass')}
                                    </p>
                                    
                                    <div className="space-y-6 flex-1">
                                        {byClass.slice(0, 5).map((cls, i) => (
                                            <div key={cls.name} className="group cursor-default">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-black text-gray-400 tracking-widest flex items-center gap-2 uppercase">
                                                        <span className="w-5 h-5 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 text-[8px] border border-gray-100">{i+1}</span>
                                                        {cls.name}
                                                    </span>
                                                    <span className="text-xs font-black text-gray-950">{cls.rate}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ${cls.rate > 80 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                                        style={{ width: `${cls.rate}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            <Card className="border-gray-100 flex flex-col" padding="p-8">
                                <div className="flex items-center gap-2 group">
                                    <h3 className="text-lg font-bold text-gray-900">{t('supervisor.statisticsPage.charts.riskZones')}</h3>
                                    <span 
                                        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-help" 
                                        title={t('supervisor.statisticsPage.charts.riskZonesSub')}
                                        onClick={() => showInfo(t('supervisor.statisticsPage.charts.riskZones'), t('supervisor.statisticsPage.charts.riskZonesSub'))}
                                    >
                                        <Info size={14} className="text-gray-300 pointer-events-none" />
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t('supervisor.statisticsPage.charts.impactBySubject')}</p>
                                
                                <div className="h-64 mt-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={bySubject.slice(0, 4)} margin={{ bottom: 20 }}>
                                            <XAxis 
                                                dataKey="name" axisLine={false} tickLine={false} 
                                                tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
                                            />
                                            <Bar dataKey="absent" fill="#0f172a" radius={[4, 4, 4, 4]} barSize={12} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('supervisor.statisticsPage.charts.criticalSubject')}</p>
                                        <p className="text-sm font-bold text-gray-950 mt-1 truncate max-w-[150px]">{bySubject[0]?.name || '---'}</p>
                                    </div>
                                    <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[10px]">-{bySubject[0]?.rate || 0}%</Badge>
                                </div>
                            </Card>
                        </div>

                        {/* Recent Alerts Section */}
                        <div className="mt-8">
                            <Card className="border-gray-100" padding="p-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{t('supervisor.statisticsPage.alerts.title')}</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t('supervisor.statisticsPage.alerts.subtitle')}</p>
                                    </div>
                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-3 py-1.5 bg-orange-50 rounded-lg self-start md:self-center">
                                        {t('supervisor.statisticsPage.alerts.recentCount', { count: kpis.totalCriticalAlerts })}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {recentAlerts.length > 0 ? (
                                        recentAlerts.map((alert) => (
                                            <div key={alert.id} className="flex items-center gap-4 p-4 bg-gray-50/30 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-md">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.severity === 'critical' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                                                    <AlertTriangle size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h4 className="text-[10px] font-black text-gray-950 uppercase tracking-widest">{alert.professor_name}</h4>
                                                        <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{new Date(alert.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-medium truncate">{alert.message}</p>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Badge className={alert.severity === 'critical' ? 'bg-rose-500 text-white' : 'bg-amber-500'}>{alert.severity}</Badge>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 text-center py-8">{t('supervisor.statisticsPage.alerts.comingSoon')}</p>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </>
                )}

                {activeView !== 'overview' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 px-2">
                        {viewItems.map((item) => (
                            <Card 
                                key={item.name} 
                                onClick={() => setSelectedEntity(item)}
                                className="border-gray-50 hover:shadow-xl transition-all h-full group flex flex-col justify-between" 
                                padding="p-6 md:p-8"
                                hover
                            >
                                <div>
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex flex-col min-w-0 pr-4">
                                            <span className="text-[10px] font-black text-gray-400 gap-2 flex items-center uppercase tracking-widest whitespace-nowrap">
                                                {activeView === 'classes' ? t('supervisor.sidebar.attendanceCalendar') : activeView === 'teachers' ? t('supervisor.dashboard.supervisor') : t('supervisor.currentSessionCard.subjectLabel')}
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-100"></span>
                                                {t('supervisor.dashboard.sessionsCount', { count: item.total })}
                                            </span>
                                            <h4 className="text-sm md:text-md font-black text-gray-950 mt-2 leading-tight uppercase group-hover:text-orange-600 transition-colors line-clamp-2 min-h-[2.5rem] break-words">{item.name}</h4>
                                        </div>
                                        <span className={`text-xl font-black shrink-0 ${item.rate > 80 ? 'text-emerald-500' : 'text-orange-500'}`}>{item.rate}%</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <MiniStatValue label={t('supervisor.statisticsPage.kpi.onTime')} value={item.onTime} />
                                    <MiniStatValue label={t('supervisor.statisticsPage.kpi.late')} value={item.late} />
                                    <MiniStatValue label={t('supervisor.statisticsPage.kpi.absent')} value={item.absent} />
                                    <div className="bg-orange-50/40 rounded-xl p-3 flex flex-col items-center justify-center transition-all hover:bg-orange-50 group/details border border-transparent hover:border-orange-100">
                                        <p className="text-[9px] font-black text-orange-400 uppercase leading-none tracking-widest">{t('supervisor.dashboard.seeAll')}</p>
                                        <ChevronRight size={12} className="text-orange-300 mt-1 transition-transform group-hover/details:translate-x-1" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {selectedEntity && (
                <Modal 
                    title={t('supervisor.statisticsPage.modal.detailedStats')}
                    onClose={() => setSelectedEntity(null)}
                >
                    <div className="space-y-5">
                        <div className="border-b border-gray-100 pb-4">
                            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest px-2.5 py-0.5 bg-orange-50 rounded-full mb-1 inline-block">
                                {activeView === 'classes' ? t('supervisor.currentSessionCard.classLabel') : activeView === 'teachers' ? t('supervisor.currentSessionCard.teacherLabel') : t('supervisor.currentSessionCard.subjectLabel')}
                            </span>
                            <h2 className="text-lg font-black text-gray-950 uppercase leading-snug break-words">
                                {selectedEntity.name}
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col justify-center">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest">{t('supervisor.statisticsPage.modal.presenceRate')}</p>
                                <p className={`text-2xl font-black ${selectedEntity.rate > 80 ? 'text-emerald-600' : 'text-orange-500'}`}>{selectedEntity.rate}%</p>
                            </div>
                            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col justify-center">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest">{t('supervisor.statisticsPage.modal.totalSessions')}</p>
                                <p className="text-2xl font-black text-gray-950">{selectedEntity.total}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <div className="flex justify-between items-center p-3 px-5 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest opacity-60">{t('supervisor.statisticsPage.modal.onTime')}</span>
                                <span className="text-lg font-black text-emerald-600">{selectedEntity.onTime}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 px-5 bg-amber-50/50 rounded-xl border border-amber-100/50">
                                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest opacity-60">{t('supervisor.statisticsPage.modal.late')}</span>
                                <span className="text-lg font-black text-amber-600">{selectedEntity.late}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 px-5 bg-rose-50/50 rounded-xl border border-rose-100/50">
                                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-widest opacity-60">{t('supervisor.statisticsPage.modal.absent')}</span>
                                <span className="text-lg font-black text-rose-600">{selectedEntity.absent}</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button 
                                onClick={() => setSelectedEntity(null)}
                                className="w-full py-3.5 bg-gray-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-[0.98]"
                            >
                                {t('supervisor.statisticsPage.modal.back')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </Layout>
    );
};

// --- Sub-components ---

interface SmallAdvancedCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: 'emerald' | 'rose' | 'amber' | 'blue' | 'orange' | 'gray';
    info?: string;
    onClick?: () => void;
    onInfo?: (title: string, content: string) => void;
}

const SmallAdvancedCard = ({ icon, label, value, color, info, onClick, onInfo }: SmallAdvancedCardProps) => {
    const variants: Record<string, string> = {
        emerald: 'bg-emerald-50 text-emerald-500',
        rose: 'bg-rose-50 text-rose-500',
        amber: 'bg-amber-50 text-amber-500',
        blue: 'bg-blue-50 text-blue-500',
        orange: 'bg-orange-50 text-orange-500',
        gray: 'bg-gray-50 text-gray-400'
    };
    return (
        <Card 
            hover 
            onClick={onClick || (info && onInfo ? () => onInfo(label, info) : undefined)}
            className="border-gray-100 flex flex-col items-center justify-center text-center h-24 relative group" 
            padding="p-4"
        >
            {info && (
                <div 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-help" 
                    title={info}
                    onClick={(e) => { e.stopPropagation(); onInfo?.(label, info); }}
                >
                    <Info size={10} className="text-gray-300 pointer-events-none" />
                </div>
            )}
            <div className={`p-2 rounded-lg ${variants[color] || variants.gray} mb-2`}>
                {icon}
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-sm font-black text-gray-950 mt-0.5">{value}</p>
        </Card>
    );
};

const MiniStatValue = ({ label, value }: { label: string, value: number }) => (
    <div className="bg-gray-50 rounded-lg p-2 text-center">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</p>
        <p className="text-xs font-black text-gray-900 mt-1 leading-none">{value}</p>
    </div>
);

export default StatisticsPage;
