import SupervisorLayout from '../components/SupervisorLayout';
import CurrentSessionCard from '../components/CurrentSessionCard';
import QuickTeacherList from '../components/QuickTeacherList';
import { useSupervisorAttendance } from '../hooks/useSupervisorAttendance';
import {
    Users, Clock, CheckCircle,
    TrendingUp, Calendar
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
    const { stats, loading } = useSupervisorAttendance();
    const { t, i18n } = useTranslation();

    return (
        <SupervisorLayout>
            <div className="space-y-8">

                {/* ╔═══════════════════════════════════════════╗ */}
                {/* ║  SECTION 1 — En-tête + Date               ║ */}
                {/* ╚═══════════════════════════════════════════╝ */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {t('supervisor.dashboard.title')}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('supervisor.dashboard.subtitle')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                        <Calendar size={16} className="text-blue-500" />
                        <span>
                            {new Date().toLocaleDateString(
                                i18n.language.startsWith('ar') ? 'ar-MR' : i18n.language,
                                { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
                            )}
                        </span>
                    </div>
                </div>

                {/* ╔═══════════════════════════════════════════╗ */}
                {/* ║  SECTION 2 — بطاقات الإحصائيات السريعة     ║ */}
                {/* ╚═══════════════════════════════════════════╝ */}
                <div>
                    <SectionHeader
                        title={t('supervisor.dashboard.summaryTitle')}
                        subtitle={t('supervisor.dashboard.summarySubtitle')}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                        <StatCard
                            icon={<Users size={22} />}
                            label={t('supervisor.dashboard.totalSessions')}
                            value={loading ? '...' : stats.total}
                            color="blue"
                        />
                        <StatCard
                            icon={<CheckCircle size={22} />}
                            label={t('supervisor.dashboard.completedSessions')}
                            value={loading ? '...' : stats.completed}
                            color="green"
                        />
                        <StatCard
                            icon={<Clock size={22} />}
                            label={t('supervisor.dashboard.pendingSessions')}
                            value={loading ? '...' : stats.pending}
                            color="amber"
                        />
                        <StatCard
                            icon={<TrendingUp size={22} />}
                            label={t('supervisor.dashboard.completionRate')}
                            value={loading ? '...' : `${stats.rate}%`}
                            color="purple"
                        />
                    </div>
                </div>

                <Divider />

                {/* ╔═══════════════════════════════════════════╗ */}
                {/* ║  SECTION 3 — الحصة الحالية                 ║ */}
                {/* ╚═══════════════════════════════════════════╝ */}
                <div>
                    <SectionHeader
                        title={t('supervisor.dashboard.currentSessionTitle')}
                        subtitle={t('supervisor.dashboard.currentSessionSubtitle')}
                    />
                    <div className="mt-3">
                        <CurrentSessionCard onAttendanceRecorded={() => { }} />
                    </div>
                </div>

                <Divider />

                {/* ╔═══════════════════════════════════════════╗ */}
                {/* ║  SECTION 4 — قائمة الأساتذة               ║ */}
                {/* ╚═══════════════════════════════════════════╝ */}
                <div>
                    <SectionHeader
                        title={t('supervisor.dashboard.activeTeachersTitle')}
                        subtitle={t('supervisor.dashboard.activeTeachersSubtitle')}
                    />
                    <div className="mt-3">
                        <QuickTeacherList />
                    </div>
                </div>

            </div>
        </SupervisorLayout>
    );
};

/* ═══════════ Section Header ═══════════ */
const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-blue-500 rounded-full" />
        <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
    </div>
);

/* ═══════════ Divider ═══════════ */
const Divider = () => (
    <div className="relative">
        <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
            <span className="bg-gray-50 px-3">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
            </span>
        </div>
    </div>
);

/* ═══════════ StatCard ═══════════ */
const colorMap: Record<string, { bg: string; icon: string; accent: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', accent: 'border-blue-200' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', accent: 'border-green-200' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', accent: 'border-amber-200' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', accent: 'border-purple-200' },
};

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
}

const StatCard = ({ icon, label, value, color }: StatCardProps) => {
    const c = colorMap[color] || colorMap.blue;
    return (
        <div className={`bg-white rounded-xl border ${c.accent} p-5 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-3">
                <div className={`${c.bg} p-2.5 rounded-lg`}>
                    <div className={c.icon}>{icon}</div>
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
