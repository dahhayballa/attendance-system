import React, { useEffect, useState } from 'react';
import { WeekUploader } from '../components/WeekUploader';
import { adminService } from '../../../services/supabase/admin.service';
import { useToast } from '../../../shared/hooks/useToast';
import {  Trash2, Calendar, Users, CheckCircle, XCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { Layout } from '../../../shared/components/layout/Layout';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, recorded: 0, rate: 0 });
  const [weeks, setWeeks] = useState<any[]>([]);
  const [,setRecentLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<{ topTeachers: any[], topClasses: any[] }>({ topTeachers: [], topClasses: [] });
  const [loading, setLoading] = useState(true);
  
  // Nouveaux états pour le filtrage
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [filterOptions, setFilterOptions] = useState<{ teachers: {label: string, value: string}[]; classes: string[]; subjects: {label: string, value: string}[] }>({ teachers: [], classes: [], subjects: [] });
  
  const { toast } = useToast();

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      let finalTeacher = selectedTeacher !== 'all' ? selectedTeacher.split('|')[0] : 'all';
      let finalSubject = selectedSubject !== 'all' ? selectedSubject.split('|')[0] : 'all';
      
      const implicitSubjectFromTeacher = selectedTeacher !== 'all' ? selectedTeacher.split('|')[1] : null;
      const implicitTeacherFromSubject = selectedSubject !== 'all' ? selectedSubject.split('|')[1] : null;

      if (implicitSubjectFromTeacher && finalSubject === 'all') {
        finalSubject = implicitSubjectFromTeacher;
      }
      if (implicitTeacherFromSubject && finalTeacher === 'all') {
        finalTeacher = implicitTeacherFromSubject;
      }

      const filters = {
        teacher: finalTeacher,
        className: selectedClass,
        subject: finalSubject
      };
      
      const [statsData, weeksData, logsData, analyticsData, optionsData] = await Promise.all([
        adminService.getGlobalStats(filters),
        adminService.getWeeksWithCounts(),
        adminService.getRecentLogs(filters),
        adminService.getAbsenceAnalytics(filters),
        adminService.getFiltersOptions()
      ]);
      setStats(statsData as any);
      setWeeks(weeksData);
      setRecentLogs(logsData);
      setAnalytics(analyticsData);
      if (optionsData) setFilterOptions(optionsData);
    } catch (error) {
      toast.error("Échec du chargement des données du tableau de bord");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboardData(); }, [selectedTeacher, selectedClass, selectedSubject]);

  const handleDeleteWeek = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette semaine ?")) return;
    try {
      await adminService.deleteWeek(id);
      toast.success("Semaine supprimée avec succès");
      loadDashboardData();
    } catch (error) {
      toast.error("Une erreur est survenue lors de la suppression");
    }
  };

  const progressPercent = stats.total > 0 ? Math.round((stats.recorded / stats.total) * 100) : 0;

  return (
    <Layout>
      <div className="space-y-6 pb-8" dir="ltr">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
              Tableau de Bord
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Vue d'ensemble de la présence</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 font-bold text-gray-700 min-w-[160px] cursor-pointer shadow-sm flex-1 md:flex-none max-w-[200px] truncate"
            >
              <option value="all">Les Professeurs</option>
              {filterOptions.teachers?.map((t, idx) => <option key={idx} value={t.value}>{t.label}</option>)}
            </select>
            
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 font-bold text-gray-700 min-w-[160px] cursor-pointer shadow-sm flex-1 md:flex-none max-w-[180px] truncate"
            >
              <option value="all">les Classes</option>
              {filterOptions.classes?.map((c, idx) => <option key={idx} value={c}>{c}</option>)}
            </select>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 font-bold text-gray-700 min-w-[160px] cursor-pointer shadow-sm flex-1 md:flex-none max-w-[180px] truncate"
            >
              <option value="all">Les Matières</option>
              {filterOptions.subjects?.map((s, idx) => <option key={idx} value={s.value}>{s.label}</option>)}
            </select>

            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all text-xs font-bold shadow-sm disabled:opacity-50 shrink-0 w-full md:w-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          <StatCard
            title="Total Séances"
            value={stats.total}
            icon={<Calendar size={16} />}
            accent="orange"
          />
          <StatCard
            title="Présents"
            value={stats.present}
            icon={<CheckCircle size={16} />}
            accent="green"
          />
          <StatCard
            title="Absents"
            value={stats.absent}
            icon={<XCircle size={16} />}
            accent="red"
          />
          <StatCard
            title="En Retard"
            value={stats.late || 0}
            icon={<Clock size={16} />}
            accent="amber"
          />
          <StatCard
            title="Taux Présence"
            value={`${stats.rate}%`}
            icon={<TrendingUp size={16} />}
            accent="blue"
            className="col-span-2 sm:col-span-1"
          />
        </div>

        {/* ── Progress Bar ── */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-sm font-bold text-gray-800">Progression des Enregistrements</span>
            </div>
            <span className="text-xs font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-lg">
              {stats.recorded} / {stats.total} séances
            </span>
          </div>

          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
              Taux d'achèvement global
            </span>
            <span className="text-xs font-black text-orange-500">{progressPercent}%</span>
          </div>
        </div>

        {/* ── Zones de Risques (Absences) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Top Teachers Absences */}
           <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                 <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-500" />
                    <span className="font-bold text-gray-800 text-sm">Professeurs (Récurrence d'absence)</span>
                 </div>
                 <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-bold uppercase border border-red-100">Top 5</span>
              </div>
              <div className="p-5 flex-1 space-y-4">
                 {analytics.topTeachers.length > 0 ? (
                    analytics.topTeachers.map((teacher, idx) => (
                       <div key={idx} className="group">
                          <div className="flex justify-between items-start mb-1.5">
                             <div>
                               <span className="text-sm font-bold text-gray-700 group-hover:text-orange-600 transition-colors uppercase tracking-tight block leading-tight">{teacher.name}</span>
                               {teacher.subject && teacher.class && (
                                 <span className="text-[10px] font-semibold text-gray-500 mt-1 block tracking-wide">
                                   <span className="text-gray-400">Matière:</span> <span className="text-gray-600">{teacher.subject}</span> <span className="mx-1 text-gray-300">•</span> <span className="text-gray-400">Classe:</span> <span className="text-gray-600">{teacher.class}</span>
                                 </span>
                               )}
                             </div>
                             <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-lg whitespace-nowrap">{teacher.count} <span className="text-[10px] opacity-70">absences</span></span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-red-500 rounded-full transition-all duration-1000 group-hover:bg-orange-500 shadow-sm"
                                style={{ width: `${Math.min((teacher.count / 5) * 100, 100)}%` }}
                             />
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-xs italic py-8">Aucune absence enregistrée.</div>
                 )}
              </div>
           </div>

           {/* Top Classes Absences */}
           <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                 <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-gray-800 text-sm">Classes Impactées (Absences Profs)</span>
                 </div>
                 <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md font-bold uppercase border border-orange-100">Top 5</span>
              </div>
              <div className="p-5 flex-1 space-y-4">
                 {analytics.topClasses.length > 0 ? (
                    analytics.topClasses.map((cl, idx) => (
                       <div key={idx} className="group">
                          <div className="flex justify-between items-end mb-1.5">
                             <span className="text-sm font-bold text-gray-700 group-hover:text-orange-600 transition-colors">{cl.name}</span>
                             <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">{cl.count} <span className="text-[10px] opacity-70">séances perdues</span></span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-orange-500 rounded-full transition-all duration-1000 group-hover:bg-red-500 shadow-sm"
                                style={{ width: `${Math.min((cl.count / 10) * 100, 100)}%` }}
                             />
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-xs italic py-8">Aucun impact constaté.</div>
                 )}
              </div>
           </div>
        </div>

        {/* ── Week Uploader ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="font-bold text-gray-800 text-sm">Importer un emploi du temps</span>
          </div>
          <div className="p-5">
            <WeekUploader onUploadComplete={loadDashboardData} />
          </div>
        </div>

        {/* ── Weeks Table ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2">
            <span className="font-bold text-gray-800 text-sm">Emplois du temps importés</span>
            <span className="bg-orange-50 text-orange-600 text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider font-bold border border-orange-100">
              {weeks.length} semaine{weeks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Mobile cards (< md) */}
          <div className="md:hidden divide-y divide-gray-50">
            {weeks.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Aucun emploi du temps importé</div>
            ) : (
              weeks.map((week) => (
                <div key={week.id} className="p-4 flex items-center justify-between gap-3 hover:bg-orange-50/30 transition-colors">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{week.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(week.start_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="bg-gray-100 text-gray-700 font-bold px-2.5 py-1 rounded-lg text-xs">
                      {week.schedules?.[0]?.count || 0} séances
                    </span>
                    <button
                      onClick={() => handleDeleteWeek(week.id)}
                      className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table (≥ md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/60 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-bold">Semaine</th>
                  <th className="px-5 py-3 font-bold">Date de début</th>
                  <th className="px-5 py-3 font-bold text-center">Séances</th>
                  <th className="px-5 py-3 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {weeks.map((week) => (
                  <tr key={week.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-gray-900 text-sm">{week.name}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 font-medium">
                      {new Date(week.start_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded-lg text-xs">
                        {week.schedules?.[0]?.count || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleDeleteWeek(week.id)}
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {weeks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-gray-400 text-sm">
                      Aucun emploi du temps importé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
};

// ── Stat Card ──────────────────────────────────────────────────────────────
const ACCENT_MAP: Record<string, { border: string; icon: string; bg: string; text: string }> = {
  orange: { border: 'border-l-orange-500', icon: 'bg-orange-100 text-orange-600', bg: '', text: '' },
  green:  { border: 'border-l-green-500',  icon: 'bg-green-100 text-green-600',   bg: '', text: '' },
  red:    { border: 'border-l-red-500',    icon: 'bg-red-100 text-red-500',       bg: '', text: '' },
  amber:  { border: 'border-l-amber-500',  icon: 'bg-amber-100 text-amber-600',   bg: '', text: '' },
  blue:   { border: 'border-l-blue-500',   icon: 'bg-blue-100 text-blue-600',     bg: '', text: '' },
};

const StatCard = ({
  title, value, icon, accent, className = '',
}: { title: string; value: string | number; icon: React.ReactNode; accent: string; className?: string }) => {
  const a = ACCENT_MAP[accent] || ACCENT_MAP.orange;
  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 border-l-4 ${a.border} shadow-sm hover:shadow-md transition-all flex items-center gap-3 sm:gap-4 ${className}`}>
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.icon}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">{title}</p>
        <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;