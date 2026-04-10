import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '../../../services/supabase/admin.service';
import { useToast } from '../../../shared/hooks/useToast';
import { 
    Users, TrendingUp, Calendar, ArrowRight, 
    Activity, Shield, FileText, ChevronRight 
} from 'lucide-react';
import { StatsWidget } from '../components/StatsWidget';
import { Layout } from '../../../shared/components/layout/Layout';
import { Link } from 'react-router-dom';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeWeek, setActiveWeek] = useState<any>(null);
  const [analytics, setAnalytics] = useState<{ topTeachers: any[], topClasses: any[] }>({ topTeachers: [], topClasses: [] });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [fetchedWeeks, analyticsData] = await Promise.all([
        adminService.getWeeksWithCounts(),
        adminService.getAbsenceAnalytics()
      ]);

      const current = fetchedWeeks.find((w: any) => w.is_active) || fetchedWeeks[0];
      setActiveWeek(current);
      setAnalytics(analyticsData);
    } catch (error) {
      toast.error(t('admin.dashboard.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const QuickActionBtn = ({ to, icon, label, description, color }: any) => (
    <Link 
      to={to} 
      className="group bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-all duration-300 flex flex-col gap-3"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${color}`}>
        {React.cloneElement(icon as React.ReactElement)}
      </div>
      <div>
        <h3 className="font-black text-gray-950 text-xs uppercase tracking-tight">{label}</h3>
        <p className="text-[10px] text-gray-400 font-medium mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="mt-auto flex justify-end">
        <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all">
          <ChevronRight size={14} />
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
             <div className="w-10 h-10 border-2 border-gray-100 border-t-black rounded-full animate-spin"></div>
             <p className="text-gray-400 text-sm font-medium animate-pulse">{t('common.loading', 'Chargement...')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-5 pb-12 animate-in fade-in duration-700" dir="ltr">
        
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 px-2">
          <div>
            <h1 className="text-xl font-black text-gray-950 tracking-tight leading-tight">
              {t('admin.dashboard.pageTitle')}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              {t('admin.dashboard.pageSubtitle')}
            </p>
          </div>
        </div>

        {/* ── Quick Navigation ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           <QuickActionBtn 
             to="/admin/live" 
             icon={<Activity size={24} />} 
             label={t('admin.sidebar.liveDashboard')} 
             description={t('admin.dashboard.quickLiveDesc', 'Surveillance des présences en temps réel')}
             color="bg-red-50 text-red-600"
           />
           <QuickActionBtn 
             to="/admin/weeks" 
             icon={<Calendar size={24} />} 
             label={t('admin.sidebar.weeks')} 
             description={t('admin.dashboard.quickWeeksDesc', 'Importation et configuration du calendrier')}
             color="bg-orange-50 text-orange-600"
           />
           <QuickActionBtn 
             to="/admin/users" 
             icon={<Shield size={24} />} 
             label={t('admin.sidebar.users')} 
             description={t('admin.dashboard.quickUsersDesc', 'Gestion des accès et des rôles')}
             color="bg-blue-50 text-blue-600"
           />
           <QuickActionBtn 
             to="/admin/reports" 
             icon={<FileText size={24} />} 
             label={t('admin.sidebar.reports')} 
             description={t('admin.dashboard.quickReportsDesc', 'Historique complet et exports Excel')}
             color="bg-purple-50 text-purple-600"
           />
        </div>

        {/* ── Active Week Summary (Inline) ── */}
        <div className="bg-gray-900 rounded-3xl p-5 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Calendar size={22} className="text-orange-400" />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">{t('admin.dashboard.activeWeekLabel')}</p>
                   <h2 className="text-xl font-black">{activeWeek?.name || '...'}</h2>
                   <p className="text-[10px] text-gray-400 mt-1 font-medium italic">
                      {activeWeek?.stats?.total || 0} {t('admin.liveDashboard.statSessions')}
                   </p>
                </div>
            </div>
            <Link to="/admin/weeks" className="relative z-10 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm flex items-center gap-2">
                {t('admin.weeks.activeBtnLabel', 'Changer de semaine')}
                <ArrowRight size={15} />
            </Link>
        </div>

        {/* ── Global KPI Stats ── */}
        <StatsWidget filters={{}} showProgress={true} />

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Teachers Chart */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-xl text-red-600">
                            <Users size={15} />
                        </div>
                        <h3 className="font-black text-gray-950 text-[11px] uppercase tracking-widest">
                            {t('admin.dashboard.teachersAbsenceTitle')}
                        </h3>
                    </div>
                </div>
                
                <div className="h-[280px] w-full">
                    {analytics.topTeachers.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.topTeachers} layout="vertical" margin={{ left: 40, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={100} 
                                    tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                                    {analytics.topTeachers.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#f87171'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                            {t('admin.dashboard.noAbsences')}
                        </div>
                    )}
                </div>
            </div>

            {/* Top Classes Chart */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <TrendingUp size={15} />
                        </div>
                        <h3 className="font-black text-gray-950 text-[11px] uppercase tracking-widest">
                            {t('admin.dashboard.classesImpactedTitle')}
                        </h3>
                    </div>
                </div>
                
                <div className="h-[280px] w-full">
                    {analytics.topClasses.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.topClasses} layout="vertical" margin={{ left: 40, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={100} 
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#6b7280' }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                                    {analytics.topClasses.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#60a5fa'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                            {t('admin.dashboard.noImpact')}
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </Layout>
  );
};

export default AdminDashboard;