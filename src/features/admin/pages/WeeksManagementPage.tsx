import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '../../../services/supabase/admin.service';
import { useToast } from '../../../shared/hooks/useToast';
import { Trash2, Calendar, Plus, CheckCircle2, AlertCircle, Clock, Check } from 'lucide-react';
import { Layout } from '../../../shared/components/layout/Layout';
import { WeekUploader } from '../components/WeekUploader';

interface WeekStats {
  total: number;
  recorded: number;
  rate: number;
}

interface Week {
  id: string;
  name: string;
  start_date: string;
  is_active: boolean;
  stats: WeekStats;
}

export const WeeksManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadWeeks = async () => {
    try {
      setLoading(true);
      const fetchedWeeks = await adminService.getWeeksWithCounts();
      setWeeks(fetchedWeeks as Week[]);
    } catch (error) {
      toast.error(t('admin.dashboard.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeeks();
  }, []);

  const handleDeleteWeek = async (id: string) => {
    if (!window.confirm(t('admin.dashboard.deleteWeekConfirm'))) return;
    try {
      await adminService.deleteWeek(id);
      toast.success(t('admin.dashboard.deleteWeekSuccess'));
      loadWeeks();
    } catch (error) {
      toast.error(t('admin.dashboard.deleteWeekError'));
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await adminService.setActiveWeek(id);
      toast.success(t('admin.weeks.setActiveSuccess', 'Semaine définie comme active'));
      loadWeeks();
    } catch (error) {
      toast.error(t('admin.weeks.setActiveError', 'Erreur lors de la définition de la semaine active'));
    }
  };

  const getWeekStatus = (startDateStr: string) => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    const now = new Date();

    if (now < startDate) return 'future';
    if (now > endDate) return 'past';
    return 'current';
  };

  const StatusBadge = ({ status, isActive }: { status: 'future' | 'past' | 'current', isActive: boolean }) => {
    if (isActive) {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-500 text-white shadow-sm ring-2 ring-green-100">
          <CheckCircle2 size={12} /> {t('admin.weeks.statusActive', 'Active')}
        </span>
      );
    }

    switch (status) {
      case 'future':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Clock size={12} /> {t('admin.weeks.statusFuture', 'Future')}
          </span>
        );
      case 'past':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
            {t('admin.weeks.statusPast', 'Passée')}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100 animate-pulse">
            <AlertCircle size={12} /> {t('admin.weeks.statusCurrent', 'En cours')}
          </span>
        );
    }
  };

  return (
    <Layout>
      <div className="space-y-8 pb-12" dir="ltr">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              {t('admin.weeks.pageTitle', 'Gestion des Semaines')}
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wide">
              {t('admin.weeks.pageSubtitle', 'Importation et configuration du calendrier')}
            </p>
          </div>
        </div>

        {/* ── Week Uploader ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                <Plus size={20} />
              </div>
              <span className="font-bold text-gray-900">{t('admin.dashboard.importTitle', 'Nouvelle Importation')}</span>
            </div>
          </div>
          <div className="p-6">
            <WeekUploader onUploadComplete={loadWeeks} />
          </div>
        </div>

        {/* ── Weeks Grid ── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Calendar className="text-orange-500" size={20} />
              <h2 className="font-bold text-gray-800 text-lg">{t('admin.dashboard.weeksTableTitle', 'Historique des Semaines')}</h2>
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                {weeks.length}
              </span>
            </div>
          </div>

          {loading && weeks.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-gray-50 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : weeks.length === 0 ? (
            <div className="bg-gray-50 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Calendar size={32} />
              </div>
              <p className="text-gray-500 font-medium">{t('admin.dashboard.noWeeks', 'Aucune semaine importée')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {weeks.map((week) => {
                const status = getWeekStatus(week.start_date);
                return (
                  <div key={week.id} className={`group bg-white rounded-3xl border ${week.is_active ? 'border-green-200 ring-4 ring-green-50' : 'border-gray-100'} shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col`}>
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <StatusBadge status={status} isActive={week.is_active} />
                        <span className="text-xs font-bold text-gray-400">ID: {week.id.slice(0, 8)}</span>
                      </div>
                      
                      <h3 className="text-xl font-black text-gray-900 group-hover:text-orange-600 transition-colors mb-1">{week.name}</h3>
                      <p className="text-sm font-medium text-gray-500 mb-6 flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(week.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-2xl p-3 text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('admin.weeks.total', 'Total')}</p>
                          <p className="text-lg font-black text-gray-900">{week.stats.total}</p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-3 text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('admin.weeks.recorded', 'Fait')}</p>
                          <p className="text-lg font-black text-gray-900">{week.stats.recorded}</p>
                        </div>
                        <div className={`rounded-2xl p-3 text-center ${week.stats.rate > 80 ? 'bg-green-50 text-green-700' : week.stats.rate > 50 ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'}`}>
                          <p className="text-[10px] font-bold opacity-60 uppercase mb-1">{t('admin.weeks.rate', 'Taux')}</p>
                          <p className="text-lg font-black">{week.stats.rate}%</p>
                        </div>
                      </div>

                      {/* Progress Bar Mini */}
                      <div className="mt-6">
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${week.is_active ? 'bg-green-500' : 'bg-orange-500'}`}
                            style={{ width: `${week.stats.rate}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50/50 border-t border-gray-50 flex items-center gap-2">
                      {!week.is_active ? (
                        <button
                          onClick={() => handleSetActive(week.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all shadow-sm"
                        >
                          <Check size={14} /> {t('admin.weeks.setActive', 'Définir active')}
                        </button>
                      ) : (
                        <div className="flex-1 flex items-center justify-center gap-2 py-2.5 text-green-600 italic text-xs font-bold">
                          <CheckCircle2 size={14} /> {t('admin.weeks.currentActive', 'Semaine de référence')}
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleDeleteWeek(week.id)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title={t('common.delete', 'Supprimer')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WeeksManagementPage;
