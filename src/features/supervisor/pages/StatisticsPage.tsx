import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SupervisorLayout from '../components/SupervisorLayout';
import WeeklyCalendar from '../components/WeeklyCalendar';
import { useStatistics } from '../hooks/useStatistics';
import {
    BarChart3, TrendingUp, Calendar, Users,
    CheckCircle, XCircle, Clock, AlertTriangle
} from 'lucide-react';
import {
    BarChart, Bar, PieChart as RePieChart, Pie, Cell,
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

/* ═══════════ Tab Config ═══════════ */

const TABS = [
    { key: 'overview', label: 'نظرة عامة', icon: <BarChart3 size={15} /> },
    { key: 'calendar', label: 'التقويم الأسبوعي', icon: <Calendar size={15} /> },
    { key: 'teachers', label: 'تحليل الأساتذة', icon: <Users size={15} /> },
    { key: 'trends', label: 'الاتجاهات', icon: <TrendingUp size={15} /> },
] as const;

type TabKey = typeof TABS[number]['key'];

const PIE_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#6B7280'];

/* ═══════════ Page ═══════════ */

const StatisticsPage = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('overview');
    const { byPeriod: stats, byClass: classDist, dailyTrend, topAbsentees, loading, error } = useStatistics();
    const { t } = useTranslation();
    const period = stats?.today;

    return (
        <SupervisorLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {t('supervisor.statisticsPage.title')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {t('supervisor.statisticsPage.subtitle')}
                    </p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex border-b border-gray-200 overflow-x-auto">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab.key
                                    ? 'text-blue-700 border-b-2 border-blue-500 bg-blue-50'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.icon}
                                {t(`supervisor.statisticsPage.tabs.${tab.key}`)}
                            </button>
                        ))}
                    </div>

                    <div className="p-5">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-12 text-red-500 text-sm">{error}</div>
                        ) : (
                            <>
                                {activeTab === 'overview' && <OverviewTab period={period} classDist={classDist} />}
                                {activeTab === 'calendar' && <CalendarTab />}
                                {activeTab === 'teachers' && <TeachersTab topAbsentees={topAbsentees} />}
                                {activeTab === 'trends' && <TrendsTab dailyTrend={dailyTrend} />}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </SupervisorLayout>
    );
};

/* ═══════════ Tab 1: Overview ═══════════ */

const OverviewTab = ({ period, classDist }: { period: any; classDist: any[] }) => {
    const rate = period?.rate ?? 0;
    return (
        <div className="space-y-6">
            {/* Rate bar */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-700">نسبة الحضور العامة</span>
                    <span className={`text-3xl font-black ${rate >= 80 ? 'text-green-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600'
                        }`}>
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
            </div>

            {/* 4 stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MiniCard icon={<CheckCircle size={16} />} label="حاضر" value={period?.present ?? 0} color="green" />
                <MiniCard icon={<XCircle size={16} />} label="غائب" value={period?.absent ?? 0} color="red" />
                <MiniCard icon={<Clock size={16} />} label="متأخر" value={period?.late ?? 0} color="amber" />
                <MiniCard icon={<AlertTriangle size={16} />} label="غير مسجل" value={period?.total - (period?.present + period?.absent + period?.late) || 0} color="gray" />
            </div>

            <Divider label="توزيع حسب الأقسام" />

            {/* Bar chart: by class */}
            {classDist && classDist.length > 0 && (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={classDist} layout="vertical">
                            <XAxis type="number" tick={{ fontSize: 10 }} />
                            <YAxis dataKey="class" type="category" width={100} tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="present" fill="#10B981" name="حاضر" stackId="a" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="absent" fill="#EF4444" name="غائب" stackId="a" radius={[0, 4, 4, 0]} />
                            <Legend />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Pie chart */}
            {period && (
                <>
                    <Divider label="توزيع الحالات" />
                    <div className="h-56 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={[
                                        { name: 'حاضر', value: period.present || 0 },
                                        { name: 'غائب', value: period.absent || 0 },
                                        { name: 'متأخر', value: period.late || 0 },
                                        { name: 'أخرى', value: Math.max(0, (period.total || 0) - (period.present || 0) - (period.absent || 0) - (period.late || 0)) },
                                    ].filter(d => d.value > 0)}
                                    cx="50%" cy="50%"
                                    innerRadius={50} outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                                </Pie>
                                <Tooltip />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
};

/* ═══════════ Tab 2: Calendar ═══════════ */

const CalendarTab = () => (
    <WeeklyCalendar />
);

/* ═══════════ Tab 3: Teachers ═══════════ */

const TeachersTab = ({ topAbsentees }: { topAbsentees: any[] }) => (
    <div className="space-y-4">
        <p className="text-sm text-gray-500">ترتيب الأساتذة حسب نسبة الغياب — الأعلى غياباً يظهر أولاً</p>

        {topAbsentees.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">لا توجد بيانات</div>
        ) : (
            <div className="space-y-2">
                {topAbsentees.map((t, i) => {
                    const rate = t.total > 0 ? Math.round((t.absent / t.total) * 100) : 0;
                    return (
                        <div key={t.teacher} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                            {/* Rank */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${i === 0 ? 'bg-red-100 text-red-700' :
                                i === 1 ? 'bg-amber-100 text-amber-700' :
                                    i === 2 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-500'
                                }`}>
                                {i + 1}
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{t.teacher}</p>
                                <p className="text-[10px] text-gray-400">{t.total} حصة • {t.absent} غياب</p>
                            </div>

                            {/* Rate bar */}
                            <div className="w-24 shrink-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className={`text-[10px] font-bold ${rate > 30 ? 'text-red-600' : 'text-green-600'}`}>
                                        {rate}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${rate}%`,
                                            backgroundColor: rate > 30 ? '#EF4444' : rate > 15 ? '#F59E0B' : '#10B981'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
);

/* ═══════════ Tab 4: Trends ═══════════ */

const TrendsTab = ({ dailyTrend }: { dailyTrend: any[] }) => (
    <div className="space-y-4">
        <p className="text-sm text-gray-500">تطور معدل الحضور على مدى الأيام الأخيرة</p>

        {dailyTrend && dailyTrend.length > 0 ? (
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrend}>
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="rate"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#3B82F6' }}
                            name="نسبة الحضور %"
                        />
                        <Line
                            type="monotone"
                            dataKey="present"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            name="حاضر"
                        />
                        <Line
                            type="monotone"
                            dataKey="absent"
                            stroke="#EF4444"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            name="غائب"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        ) : (
            <div className="py-12 text-center text-gray-400 text-sm">لا توجد بيانات كافية لعرض الاتجاهات</div>
        )}
    </div>
);

/* ═══════════ Shared Components ═══════════ */

const MiniCard = ({ icon, label, value, color }: {
    icon: React.ReactNode; label: string; value: number; color: string;
}) => {
    const colors: Record<string, string> = {
        green: 'bg-green-50 border-green-200 text-green-700',
        red: 'bg-red-50 border-red-200 text-red-700',
        amber: 'bg-amber-50 border-amber-200 text-amber-700',
        gray: 'bg-gray-50 border-gray-200 text-gray-500',
    };
    return (
        <div className={`rounded-xl border p-3.5 text-center ${colors[color] || colors.gray}`}>
            <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-[10px]">{label}</p>
        </div>
    );
};

const Divider = ({ label }: { label: string }) => (
    <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
            <span className="bg-white px-3 text-[11px] text-gray-400 font-medium">{label}</span>
        </div>
    </div>
);

export default StatisticsPage;
