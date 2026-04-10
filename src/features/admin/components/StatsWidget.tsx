import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { useGlobalStats, StatsFilters } from '../hooks/useGlobalStats';
import { StatCard } from './StatCard';

interface StatsWidgetProps {
  filters: StatsFilters;
  showProgress?: boolean;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ filters, showProgress = true }) => {
  const { t } = useTranslation();
  const { stats, loading } = useGlobalStats(filters);

  const progressPercent = stats.total > 0 ? Math.round((stats.recorded / stats.total) * 100) : 0;

  if (loading && stats.total === 0) {
      return (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
              ))}
          </div>
      );
  }

  return (
    <div className="space-y-6">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard
          title={t('admin.dashboard.statTotalSessions')}
          value={stats.total}
          icon={<Calendar size={16} />}
          accent="orange"
        />
        <StatCard
          title={t('admin.dashboard.statPresent')}
          value={stats.present}
          icon={<CheckCircle size={16} />}
          accent="green"
        />
        <StatCard
          title={t('admin.dashboard.statAbsent')}
          value={stats.absent}
          icon={<XCircle size={16} />}
          accent="red"
        />
        <StatCard
          title={t('admin.dashboard.statLate')}
          value={stats.late || 0}
          icon={<Clock size={16} />}
          accent="amber"
        />
        <StatCard
          title={t('admin.dashboard.statRate')}
          value={`${stats.rate}%`}
          icon={<TrendingUp size={16} />}
          accent="blue"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* ── Progress Bar ── */}
      {showProgress && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-sm font-bold text-gray-800">{t('admin.dashboard.progressTitle')}</span>
            </div>
            <span className="text-xs font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-lg">
              {t('admin.dashboard.progressSessions', { recorded: stats.recorded, total: stats.total })}
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
              {t('admin.dashboard.progressLabel')}
            </span>
            <span className="text-xs font-black text-orange-500">{progressPercent}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
