import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useStatistics } from '../hooks/useStatistics';
import { useRole } from '../../features/auth/hooks/useRole';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { 
    Users, Clock, AlertTriangle, CheckCircle, 
    TrendingUp, Activity, BarChart3, Calendar, RefreshCw,
    GraduationCap, UserCheck, ChevronRight, BookOpen, Bell, Info, Filter, Search
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
const StatisticsPage = () => {
    const { 
        kpis, rates, recentAlerts, dailyTrend, byClass, byTeacher, bySubject, advanced, timeframe, setTimeframe, 
        loading, error, refetch, options, filters, setFilters 
    } = useStatistics();
    const { role } = useRole();
    const [activeView, setActiveView] = useState<ViewType>('overview');
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string, content: string }>({ 
        isOpen: false, 
        title: '', 
        content: '' 
    });

    const showInfo = (title: string, content: string) => {
        setInfoModal({ isOpen: true, title, content });
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-2 border-gray-100 border-t-black rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm font-medium animate-pulse">Chargement...</p>
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
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Une erreur est survenue</h3>
                    <p className="text-gray-500 mb-8">{error}</p>
                    <button onClick={refetch} className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all">
                        Réessayer
                    </button>
                </div>
            </Layout>
        );
    }

    const presenceData = [
        { name: 'Présent', value: rates.presenceRate, color: '#10b981' },
        { name: 'Absent', value: 100 - rates.presenceRate, color: '#f1f5f9' },
    ];

    return (
        <Layout>
            <div className={`space-y-8 animate-in fade-in duration-700 font-sans`}>
                {/* Header with simple switches */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
                    <div>
                        <h1 className="text-2xl font-black text-gray-950 tracking-tight flex items-center gap-2">
                            Dashboard {activeView !== 'overview' && <><ChevronRight className="text-gray-300" /> {activeView === 'classes' ? 'Classes' : activeView === 'teachers' ? 'Enseignants' : 'Matières'}</>}
                        </h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Analyse approfondie ({role})</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                            {[
                                { id: 'overview', icon: <TrendingUp size={14} />, label: 'Général' },
                                { id: 'classes', icon: <GraduationCap size={14} />, label: 'Classes' },
                                { id: 'teachers', icon: <UserCheck size={14} />, label: 'Profs' },
                                { id: 'subjects', icon: <BookOpen size={14} />, label: 'Matières' }
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
                        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                            <button 
                                onClick={() => setTimeframe('week')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${timeframe === 'week' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                SEMAINE
                            </button>
                            <button 
                                onClick={() => setTimeframe('month')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${timeframe === 'month' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                MOIS
                            </button>
                        </div>
                    </div>
                </div>

                {/* FILTERS BAR */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
                    <div className="relative group">
                        <div className="absolute inset-y-0 ltr:left-4 rtl:right-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                            <UserCheck size={14} />
                        </div>
                        <select 
                            value={filters.teacher}
                            onChange={(e) => setFilters((prev: any) => ({ ...prev, teacher: e.target.value }))}
                            className="w-full ltr:pl-12 rtl:pr-12 pr-10 py-3.5 bg-white border border-gray-100 rounded-2xl text-[11px] font-black text-gray-900 outline-none focus:ring-4 focus:ring-black/5 focus:border-gray-200 transition-all appearance-none cursor-pointer shadow-sm uppercase tracking-widest"
                        >
                            <option value="all">TOUS LES ENSEIGNANTS</option>
                            {options.teachers.map((t: string) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="absolute inset-y-0 ltr:right-4 rtl:left-4 flex items-center pointer-events-none text-gray-300">
                             <ChevronRight size={14} className="rotate-90" />
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 ltr:left-4 rtl:right-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                            <BookOpen size={14} />
                        </div>
                        <select 
                            value={filters.subject}
                            onChange={(e) => setFilters((prev: any) => ({ ...prev, subject: e.target.value }))}
                            className="w-full ltr:pl-12 rtl:pr-12 pr-10 py-3.5 bg-white border border-gray-100 rounded-2xl text-[11px] font-black text-gray-900 outline-none focus:ring-4 focus:ring-black/5 focus:border-gray-200 transition-all appearance-none cursor-pointer shadow-sm uppercase tracking-widest"
                        >
                            <option value="all">TOUTES LES MATIÈRES</option>
                            {options.subjects.map((s: string) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="absolute inset-y-0 ltr:right-4 rtl:left-4 flex items-center pointer-events-none text-gray-300">
                             <ChevronRight size={14} className="rotate-90" />
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 ltr:left-4 rtl:right-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                            <GraduationCap size={14} />
                        </div>
                        <select 
                            value={filters.class}
                            onChange={(e) => setFilters((prev: any) => ({ ...prev, class: e.target.value }))}
                            className="w-full ltr:pl-12 rtl:pr-12 pr-10 py-3.5 bg-white border border-gray-100 rounded-2xl text-[11px] font-black text-gray-900 outline-none focus:ring-4 focus:ring-black/5 focus:border-gray-200 transition-all appearance-none cursor-pointer shadow-sm uppercase tracking-widest"
                        >
                            <option value="all">TOUTES LES CLASSES</option>
                            {options.classes.map((c: string) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="absolute inset-y-0 ltr:right-4 rtl:left-4 flex items-center pointer-events-none text-gray-300">
                             <ChevronRight size={14} className="rotate-90" />
                        </div>
                    </div>
                </div>

                {activeView === 'overview' && (
                    <>
                         {/* ADVANCED KPI SECTION */}
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                             <SmallAdvancedCard onInfo={showInfo} icon={<CheckCircle size={14} />} label="Présents" value={kpis.totalPresence} color="emerald" info="Nombre total de présences enregistrées sur la période." />
                             <SmallAdvancedCard onInfo={showInfo} icon={<Activity size={14} />} label="Absents" value={kpis.totalAbsent} color="rose" info="Total des sessions marquées comme 'Absent' ou 'Absent Justifié'." />
                             <SmallAdvancedCard onInfo={showInfo} icon={<Clock size={14} />} label="Retards" value={kpis.totalLate} color="amber" info="Sessions enregistrées avec un statut de retard." />
                             <SmallAdvancedCard onInfo={showInfo} icon={<TrendingUp size={14} />} label="Score (Avg)" value={`${advanced.avgPoints}/10`} color="blue" info="Note d'assiduité moyenne calculée sur les points de ponctualité." />
                             <SmallAdvancedCard onInfo={showInfo} icon={<Clock size={14} />} label="Délai (Avg)" value={`${advanced.avgDelay}m`} color="gray" info="Temps de retard moyen constaté (en minutes)." />
                             <SmallAdvancedCard onInfo={showInfo} icon={<Bell size={14} />} label="Notifications" value={advanced.unreadNotifications} color={advanced.unreadNotifications > 0 ? "orange" : "gray"} info="Alertes système en attente de lecture." />
                        </div>

                        {/* CHARTS SECTION */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Evolution Chart */}
                            <div className="lg:col-span-2">
                                <Card className="border-gray-100 h-full flex flex-col justify-between" padding="p-8">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <div className="flex items-center gap-2 group">
                                                <h3 className="text-lg font-bold text-gray-900">Évolution Présence</h3>
                                                <span 
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity cursor-help" 
                                                    title="Courbe d'activité journalière des séances enregistrées."
                                                    onClick={() => showInfo("Évolution Présence", "Courbe d'activité journalière des séances enregistrées.")}
                                                >
                                                    <Info size={14} className="text-gray-300 pointer-events-none" />
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Activité sur les {timeframe === 'week' ? '7' : '30'} derniers jours</p>
                                        </div>
                                    </div>
                                    <div className="h-64 mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={dailyTrend}>
                                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickFormatter={(str) => {
                                                        const d = new Date(str);
                                                        return d.toLocaleDateString('fr-FR', { weekday: 'short' });
                                                    }}
                                                />
                                                <YAxis hide />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                <Area type="monotone" dataKey="presence" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="transparent" name="Présents" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </div>

                            {/* Circular Taux */}
                            <Card className="border-gray-100" padding="p-8 text-center flex flex-col items-center justify-center">
                                <div className="flex items-center gap-2 group">
                                    <h3 className="text-lg font-bold text-gray-900">Assiduité</h3>
                                    <span 
                                        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-help" 
                                        title="Répartition globale en pourcentage entre le nombre de présents et d'absents."
                                        onClick={() => showInfo("Assiduité", "Répartition globale en pourcentage entre le nombre de présents et d'absents.")}
                                    >
                                        <Info size={14} className="text-gray-300 pointer-events-none" />
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Taux Global</p>
                                
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
                                                {presenceData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black text-gray-950">{rates.presenceRate}%</span>
                                        <Badge className="bg-gray-50 border-gray-100 text-gray-400 text-[9px] mt-2 font-black uppercase tracking-widest px-3 py-1 rounded-lg">Performance</Badge>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* LISTS AND ANALYSIS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Alert list */}
                            <div className="lg:col-span-2">
                                <Card className="border-gray-100" padding="p-0 overflow-hidden">
                                    <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                        <div className="flex items-center gap-2 group">
                                            <h3 className="text-lg font-bold text-gray-900">Dernières Alertes</h3>
                                            <span 
                                                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-help" 
                                                title="Liste des incidents récents détectés par le système de surveillance."
                                                onClick={() => showInfo("Dernières Alertes", "Liste des incidents récents détectés par le système de surveillance.")}
                                            >
                                                <Info size={14} className="text-gray-300 pointer-events-none" />
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => showInfo('Logs Complet', 'Ouverture des logs complets...')}
                                            className="flex items-center gap-1 text-[10px] font-black text-orange-600 hover:text-black uppercase tracking-widest transition-colors"
                                        >
                                            Logs Complet <ChevronRight size={12} />
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-white">
                                                    <th className="px-8 py-4">Professeur</th>
                                                    <th className="px-8 py-4">Sévérité</th>
                                                    <th className="px-8 py-4 text-right">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 bg-white">
                                                {recentAlerts.slice(0, 5).map(alertItem => (
                                                    <tr 
                                                        key={alertItem.id} 
                                                        onClick={() => showInfo(`Alerte de ${alertItem.professor_name}`, alertItem.message)}
                                                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                                    >
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-3">
                                                                 <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                                    {alertItem.professor_name.slice(0, 2).toUpperCase()}
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors uppercase truncate max-w-[150px]">{alertItem.professor_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                                alertItem.severity === 'critical' ? 'bg-rose-50 text-rose-500' : 
                                                                alertItem.severity === 'high' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                                                            }`}>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                                                {alertItem.severity === 'critical' ? 'Critique' : alertItem.severity === 'high' ? 'Important' : 'Normal'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 text-right text-sm font-bold text-gray-950 whitespace-nowrap">
                                                            {new Date(alertItem.created_at).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>

                            {/* Bar Chart - Peaks */}
                            <Card className="border-gray-100 flex flex-col" padding="p-8">
                                <div className="flex items-center gap-2 group">
                                    <h3 className="text-lg font-bold text-gray-900">Zones à risques</h3>
                                    <span 
                                        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-help" 
                                        title="Identification des matières les plus impactées par les absences enseignants."
                                        onClick={() => showInfo("Zones à risques", "Identification des matières les plus impactées par les absences enseignants.")}
                                    >
                                        <Info size={14} className="text-gray-300 pointer-events-none" />
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Impact par Matière</p>
                                
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
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Matière Critique</p>
                                        <p className="text-sm font-bold text-gray-950 mt-1 truncate max-w-[150px]">{bySubject[0]?.name || '---'}</p>
                                    </div>
                                    <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[10px]">-{bySubject[0]?.rate || 0}%</Badge>
                                </div>
                            </Card>
                        </div>
                    </>
                )}

                {activeView !== 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-right-4 duration-500 px-2 lg:px-0">
                        {(activeView === 'classes' ? byClass : activeView === 'teachers' ? byTeacher : bySubject).map((item) => (
                            <Card key={item.name} className="border-gray-50 hover:shadow-xl transition-all h-full" padding="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col min-w-0 pr-4">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeView === 'classes' ? 'Classe' : activeView === 'teachers' ? 'Prof' : 'Matière'}</span>
                                        <h4 className="text-sm font-black text-gray-950 mt-1 leading-snug truncate uppercase">{item.name}</h4>
                                    </div>
                                    <span className={`text-lg font-black shrink-0 ${item.rate > 80 ? 'text-emerald-500' : 'text-orange-500'}`}>{item.rate}%</span>
                                </div>
                                <div className="mt-6 space-y-4">
                                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-1000 ${item.rate > 80 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${item.rate}%` }}></div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <MiniStatValue label="Pres" value={item.present} />
                                        <MiniStatValue label="Ret" value={item.late} />
                                        <MiniStatValue label="Abs" value={item.absent} />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {infoModal.isOpen && (
                <Modal 
                    title={infoModal.title} 
                    onClose={() => setInfoModal(prev => ({ ...prev, isOpen: false }))}
                >
                    <div className="py-2">
                        <p className="text-sm font-medium text-gray-500 leading-relaxed">
                            {infoModal.content}
                        </p>
                    </div>
                </Modal>
            )}
        </Layout>
    );
};

// --- Sub-components ---

const SmallAdvancedCard = ({ icon, label, value, color, info, onClick, onInfo }: any) => {
    const variants: any = {
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
