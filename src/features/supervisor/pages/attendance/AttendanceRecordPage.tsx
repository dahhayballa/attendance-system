import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SupervisorLayout from '../../components/SupervisorLayout';
import CurrentSessionCard from '../../components/CurrentSessionCard';
import { supabase } from '../../../../services/supabase/client';
import {
    CheckCircle, XCircle, Clock, AlertTriangle,
    RefreshCw, Users
} from 'lucide-react';

/* ═══════════ Page ═══════════ */

const AttendanceRecordPage = () => {
    const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, pending: 0 });
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    const fetchSummary = useCallback(async () => {
        try {
            setLoading(true);
            const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            const today = days[new Date().getDay()];

            const { data } = await supabase
                .from('schedules')
                .select('status')
                .eq('day', today);

            if (data) {
                const total = data.length;
                const present = data.filter(s => s.status === 'present' || s.status === 'completed').length;
                const absent = data.filter(s => s.status === 'absent').length;
                const late = data.filter(s => s.status === 'late').length;
                const pending = total - present - absent - late;
                setSummary({ total, present, absent, late, pending });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);

    const rate = summary.total > 0
        ? Math.round(((summary.present + summary.late) / summary.total) * 100)
        : 0;

    return (
        <SupervisorLayout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {t('supervisor.attendanceRecordPage.title')}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('supervisor.attendanceRecordPage.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={fetchSummary}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                        <RefreshCw size={14} />
                        {t('supervisor.attendanceRecordPage.refresh')}
                    </button>
                </div>

                {/* Summary Cards */}
                <div>
                    <SectionHeader
                        title={t('supervisor.attendanceRecordPage.summaryTitle')}
                        subtitle={t('supervisor.attendanceRecordPage.summarySubtitle')}
                    />
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
                        <SummaryCard icon={<Users size={18} />} label={t('supervisor.dashboard.totalSessions')} value={summary.total} color="blue" loading={loading} />
                        <SummaryCard icon={<CheckCircle size={18} />} label={t('supervisor.statisticsPage.tabs.teachers') ? 'حاضر' : 'حاضر'} value={summary.present} color="green" loading={loading} />
                        <SummaryCard icon={<XCircle size={18} />} label="غائب" value={summary.absent} color="red" loading={loading} />
                        <SummaryCard icon={<Clock size={18} />} label="متأخر" value={summary.late} color="amber" loading={loading} />
                        <SummaryCard icon={<AlertTriangle size={18} />} label="في الانتظار" value={summary.pending} color="gray" loading={loading} />
                    </div>
                </div>

                {/* Progress */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-gray-700">
                            {t('supervisor.attendanceRecordPage.completionRate')}
                        </span>
                        <span className={`text-2xl font-black ${rate >= 80 ? 'text-green-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {rate}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${rate}%`,
                                backgroundColor: rate >= 80 ? '#10B981' : rate >= 50 ? '#F59E0B' : '#EF4444'
                            }}
                        />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">
                        {t('supervisor.attendanceRecordPage.progressText', {
                            recorded: summary.present + summary.absent + summary.late,
                            total: summary.total,
                        })}
                    </p>
                </div>

                <Divider />

                {/* Current Session */}
                <div>
                    <SectionHeader
                        title={t('supervisor.attendanceRecordPage.currentSessionTitle')}
                        subtitle={t('supervisor.attendanceRecordPage.currentSessionSubtitle')}
                    />
                    <div className="mt-3">
                        <CurrentSessionCard onAttendanceRecorded={fetchSummary} />
                    </div>
                </div>
            </div>
        </SupervisorLayout>
    );
};

/* ═══════════ Sub-components ═══════════ */

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-blue-500 rounded-full" />
        <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
    </div>
);

const Divider = () => (
    <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center"><span className="bg-gray-50 px-3"><div className="w-1.5 h-1.5 bg-gray-300 rounded-full" /></span></div>
    </div>
);

const SummaryCard = ({ icon, label, value, color, loading }: {
    icon: React.ReactNode; label: string; value: number; color: string; loading: boolean;
}) => {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 border-blue-200 text-blue-600',
        green: 'bg-green-50 border-green-200 text-green-600',
        red: 'bg-red-50 border-red-200 text-red-600',
        amber: 'bg-amber-50 border-amber-200 text-amber-600',
        gray: 'bg-gray-50 border-gray-200 text-gray-500',
    };
    return (
        <div className={`rounded-xl border p-4 ${colors[color] || colors.gray}`}>
            <div className="flex items-center gap-2 mb-2">{icon}<span className="text-[11px] font-medium">{label}</span></div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '...' : value}</p>
        </div>
    );
};

export default AttendanceRecordPage;
