import SupervisorLayout from '../components/SupervisorLayout';
import CurrentSessionCard from '../components/CurrentSessionCard';
import QuickTeacherList from '../components/QuickTeacherList';
import { useSupervisorAttendance } from '../hooks/useSupervisorAttendance';
import { Users, Clock, CheckCircle, TrendingUp, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StatCard } from '../components/ui/StatCard';
import { SectionHeader, Divider } from '../components/ui/LayoutElements';

const Dashboard = () => {
    const { stats, loading } = useSupervisorAttendance();
    const { t, i18n } = useTranslation();

    return (
        <SupervisorLayout>
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{t('supervisor.dashboard.title')}</h2>
                        <p className="text-sm text-gray-500 mt-1">{t('supervisor.dashboard.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                        <Calendar size={16} className="text-blue-500" />
                        <span>{new Date().toLocaleDateString(i18n.language.startsWith('ar') ? 'ar-MR' : i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>

                <div>
                    <SectionHeader title={t('supervisor.dashboard.summaryTitle')} subtitle={t('supervisor.dashboard.summarySubtitle')} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                        <StatCard icon={<Users size={22} />} label={t('supervisor.dashboard.totalSessions')} value={loading ? '...' : stats.total} color="blue" />
                        <StatCard icon={<CheckCircle size={22} />} label={t('supervisor.dashboard.completedSessions')} value={loading ? '...' : stats.present} color="green" />
                        <StatCard icon={<Clock size={22} />} label={t('supervisor.dashboard.pendingSessions')} value={loading ? '...' : stats.pending} color="amber" />
                        <StatCard icon={<TrendingUp size={22} />} label={t('supervisor.dashboard.completionRate')} value={loading ? '...' : `${stats.rate}%`} color="purple" />
                    </div>
                </div>

                <Divider />

                <div>
                    <SectionHeader title={t('supervisor.dashboard.currentSessionTitle')} subtitle={t('supervisor.dashboard.currentSessionSubtitle')} />
                    <div className="mt-3">
                        <CurrentSessionCard onAttendanceRecorded={() => { }} />
                    </div>
                </div>

                <Divider />

                <div>
                    <SectionHeader title={t('supervisor.dashboard.activeTeachersTitle')} subtitle={t('supervisor.dashboard.activeTeachersSubtitle')} />
                    <div className="mt-3">
                        <QuickTeacherList />
                    </div>
                </div>
            </div>
        </SupervisorLayout>
    );
};

export default Dashboard;
