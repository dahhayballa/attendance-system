import { useState } from 'react';
import { useStatistics } from '../hooks/useStatistics';
import {
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    TrendingUp, AlertTriangle, RefreshCw
} from 'lucide-react';

/* ═══════════ Constants ═══════════ */

const COLORS = {
    present: '#10B981',
    absent: '#EF4444',
    late: '#F59E0B',
    excused: '#6B7280',
};

const PERIOD_LABELS: Record<string, string> = {
    today: 'اليوم',
    week: 'هذا الأسبوع',
    month: 'هذا الشهر',
};

/* ═══════════ Component ═══════════ */

interface StatisticsPanelProps {
    className?: string;
    onTeacherClick?: (teacher: string) => void;
}

const StatisticsPanel = ({ className = '', onTeacherClick }: StatisticsPanelProps) => {
    const { overall, byPeriod, topAbsentees, byClass, bySubject, dailyTrend, loading, error, refetch } = useStatistics();
    const [activePeriod, setActivePeriod] = useState<'today' | 'week' | 'month'>('today');

    const currentPeriod = byPeriod[activePeriod];
    const rateColor = overall.percentage >= 80 ? 'text-green-600' : overall.percentage >= 50 ? 'text-amber-600' : 'text-red-600';
    const barColor = overall.percentage >= 80 ? '#10B981' : overall.percentage >= 50 ? '#F59E0B' : '#EF4444';

    // Pie chart data
    const pieData = [
        { name: 'حاضر', value: overall.present, color: COLORS.present },
        { name: 'غائب', value: overall.absent, color: COLORS.absent },
        { name: 'متأخر', value: overall.late, color: COLORS.late },
        { name: 'مبرر', value: overall.excused, color: COLORS.excused },
    ].filter(d => d.value > 0);

    if (loading) {
        return (
            <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 ${className}`}>
                <div className="h-5 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded-full w-full animate-pulse" />
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}
                </div>
                <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-white rounded-2xl border border-red-200 shadow-sm p-6 text-center ${className}`}>
                <p className="text-red-500 text-sm mb-3">{error}</p>
                <button onClick={refetch} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto">
                    <RefreshCw size={14} /> إعادة المحاولة
                </button>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* ═══ Overall Rate Card ═══ */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-500" />
                        نسبة الحضور العامة
                    </h3>
                    <span className={`text-2xl font-bold ${rateColor}`}>{overall.percentage}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${overall.percentage}%`, backgroundColor: barColor }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                    <span>{overall.present} حاضر</span>
                    <span>{overall.absent} غائب</span>
                    <span>{overall.total} إجمالي</span>
                </div>
            </div>

            {/* ═══ Period Toggle + Stats ═══ */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {(['today', 'week', 'month'] as const).map(period => (
                        <button
                            key={period}
                            onClick={() => setActivePeriod(period)}
                            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activePeriod === period
                                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {PERIOD_LABELS[period]}
                        </button>
                    ))}
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                        <MiniStat label="حاضر" value={currentPeriod.present} color="green" />
                        <MiniStat label="غائب" value={currentPeriod.absent} color="red" />
                        <MiniStat label="متأخر" value={currentPeriod.late} color="amber" />
                        <MiniStat label="إجمالي" value={currentPeriod.total} color="gray" />
                    </div>
                </div>
            </div>

            {/* ═══ Pie Chart — Status Distribution ═══ */}
            {pieData.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <h4 className="text-xs font-bold text-gray-700 mb-3">توزيع الحالات</h4>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={65}
                                    dataKey="value"
                                    paddingAngle={3}
                                    stroke="none"
                                >
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                                    formatter={(value: any, name: any) => [value, name]}
                                />
                                <Legend
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ═══ Bar Chart — By Class ═══ */}
            {byClass.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <h4 className="text-xs font-bold text-gray-700 mb-3">الحضور حسب القسم</h4>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={byClass} layout="vertical" margin={{ left: 0, right: 10 }}>
                                <XAxis type="number" tick={{ fontSize: 10 }} />
                                <YAxis
                                    type="category"
                                    dataKey="class"
                                    width={80}
                                    tick={{ fontSize: 10 }}
                                />
                                <Tooltip
                                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                                />
                                <Bar dataKey="present" name="حاضر" fill={COLORS.present} radius={[0, 4, 4, 0]} barSize={12} />
                                <Bar dataKey="absent" name="غائب" fill={COLORS.absent} radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ═══ Bar Chart — By Subject ═══ */}
            {bySubject && bySubject.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <h4 className="text-xs font-bold text-gray-700 mb-3">الحضور حسب المادة (اليوم)</h4>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bySubject} layout="vertical" margin={{ left: 0, right: 10 }}>
                                <XAxis type="number" tick={{ fontSize: 10 }} />
                                <YAxis
                                    type="category"
                                    dataKey="subject"
                                    width={80}
                                    tick={{ fontSize: 10 }}
                                />
                                <Tooltip
                                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                                />
                                <Bar dataKey="present" name="حاضر" fill={COLORS.present} radius={[0, 4, 4, 0]} barSize={12} />
                                <Bar dataKey="absent" name="غائب" fill={COLORS.absent} radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ═══ Line Chart — Daily Trend ═══ */}
            {dailyTrend.length > 1 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <h4 className="text-xs font-bold text-gray-700 mb-3">التوجه اليومي</h4>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyTrend} margin={{ left: 0, right: 10 }}>
                                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="present"
                                    name="حاضر"
                                    stroke={COLORS.present}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="absent"
                                    name="غائب"
                                    stroke={COLORS.absent}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                />
                                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ═══ Top Absentees ═══ */}
            {topAbsentees.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-red-500" />
                        <h4 className="text-xs font-bold text-red-700">الأساتذة الغائبون (اليوم)</h4>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {topAbsentees.map((t, i) => (
                            <button
                                key={t.teacher}
                                onClick={() => onTeacherClick?.(t.teacher)}
                                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-right"
                            >
                                <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{t.teacher}</p>
                                    <p className="text-[11px] text-gray-500">{t.absences} غياب من {t.totalClasses} حصة</p>
                                </div>
                                <div className="text-left shrink-0">
                                    <span className={`text-sm font-bold ${t.rate > 30 ? 'text-red-600' : 'text-amber-600'}`}>
                                        {t.rate}%
                                    </span>
                                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                                        <div
                                            className="h-full rounded-full bg-red-500"
                                            style={{ width: `${Math.min(100, t.rate)}%` }}
                                        />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ═══════════ Mini Stat Card ═══════════ */

const miniColors: Record<string, { bg: string; text: string; border: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

const MiniStat = ({ label, value, color }: { label: string; value: number; color: string }) => {
    const c = miniColors[color] || miniColors.gray;
    return (
        <div className={`${c.bg} rounded-xl border ${c.border} p-3 text-center`}>
            <p className="text-lg font-bold text-gray-900">{value}</p>
            <p className={`text-[10px] font-medium ${c.text}`}>{label}</p>
        </div>
    );
};

export default StatisticsPanel;
