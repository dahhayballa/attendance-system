import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SupervisorLayout from '../../components/SupervisorLayout';
import { supabase } from '../../../../services/supabase/client';
import {
    Search, ChevronDown, ChevronUp,
    CheckCircle, XCircle, Clock, User
} from 'lucide-react';

/* ═══════════ Types ═══════════ */

interface TeacherProfile {
    name: string;
    totalClasses: number;
    present: number;
    absent: number;
    late: number;
    rate: number;
    classes: { day: string; time: string; subject: string; class: string; room: string; status: string }[];
}

/* ═══════════ Page ═══════════ */

const TeacherProfilesPage = () => {
    const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
    const [filtered, setFiltered] = useState<TeacherProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'rate' | 'absent'>('name');
    const [expanded, setExpanded] = useState<string | null>(null);
    const { t, i18n } = useTranslation();

    const fetchTeachers = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('schedules')
                .select('*')
                .order('teacher', { ascending: true });

            if (!data) return;

            const map = new Map<string, TeacherProfile>();
            data.forEach((s: any) => {
                if (!s.teacher) return;
                const t = map.get(s.teacher) || {
                    name: s.teacher, totalClasses: 0, present: 0, absent: 0, late: 0, rate: 0, classes: [] as TeacherProfile['classes']
                };
                t.totalClasses++;
                if (s.status === 'present' || s.status === 'completed') t.present++;
                else if (s.status === 'absent') t.absent++;
                else if (s.status === 'late') t.late++;
                t.classes.push({
                    day: s.day || '', time: `${s.time_start || ''}-${s.time_end || ''}`,
                    subject: s.subject || '', class: s.class || '', room: s.room || '',
                    status: s.status || 'pending',
                });
                map.set(s.teacher, t);
            });

            const list = Array.from(map.values()).map(t => ({
                ...t,
                rate: t.totalClasses > 0 ? Math.round((t.present / t.totalClasses) * 100) : 0
            }));

            setTeachers(list);
            setFiltered(list);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

    // Search + sort
    useEffect(() => {
        let list = teachers.filter(t =>
            t.name.toLowerCase().includes(search.toLowerCase())
        );
        if (sortBy === 'rate') list.sort((a, b) => a.rate - b.rate);
        else if (sortBy === 'absent') list.sort((a, b) => b.absent - a.absent);
        else list.sort((a, b) => a.name.localeCompare(b.name, i18n.language));
        setFiltered(list);
    }, [search, sortBy, teachers]);

    const statusLabel = (s: string) => {
        if (s === 'present' || s === 'completed') return { text: t('supervisor.statisticsPanel?.present') || 'حاضر', cls: 'bg-green-100 text-green-700' };
        if (s === 'absent') return { text: 'غائب', cls: 'bg-red-100 text-red-700' };
        if (s === 'late') return { text: 'متأخر', cls: 'bg-amber-100 text-amber-700' };
        return { text: 'غير مسجل', cls: 'bg-gray-100 text-gray-500' };
    };

    return (
        <SupervisorLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {t('supervisor.teacherProfilesPage.title')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {t('supervisor.teacherProfilesPage.subtitle')}
                    </p>
                </div>

                {/* Search + Sort */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={t('supervisor.teacherProfilesPage.searchPlaceholder')}
                                className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-300"
                            />
                        </div>
                        <div className="flex gap-2">
                            {([
                                { key: 'name' as const, label: t('supervisor.teacherProfilesPage.sortByName') },
                                { key: 'rate' as const, label: t('supervisor.teacherProfilesPage.sortByRate') },
                                { key: 'absent' as const, label: t('supervisor.teacherProfilesPage.sortByAbsent') },
                            ]).map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => setSortBy(s.key)}
                                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${sortBy === s.key
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">
                        {t('supervisor.teacherProfilesPage.countLabel', { count: filtered.length })}
                    </p>
                </div>

                {/* Teacher list */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-sm">
                        {t('supervisor.teacherProfilesPage.noResults')}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map(t => (
                            <div key={t.name} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                {/* Teacher row */}
                                <button
                                    onClick={() => setExpanded(expanded === t.name ? null : t.name)}
                                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                        <User size={18} className="text-blue-600" />
                                    </div>
                                    <div className="flex-1 text-right min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{t.name}</p>
                                        <p className="text-[10px] text-gray-400">{t.totalClasses} حصة</p>
                                    </div>

                                    {/* Mini stats */}
                                    <div className="hidden sm:flex items-center gap-3">
                                        <MiniStat icon={<CheckCircle size={12} />} value={t.present} color="text-green-600" />
                                        <MiniStat icon={<XCircle size={12} />} value={t.absent} color="text-red-600" />
                                        <MiniStat icon={<Clock size={12} />} value={t.late} color="text-amber-600" />
                                    </div>

                                    {/* Rate */}
                                    <div className="w-16 text-center">
                                        <span className={`text-sm font-bold ${t.rate >= 80 ? 'text-green-600' : t.rate >= 50 ? 'text-amber-600' : 'text-red-600'
                                            }`}>
                                            {t.rate}%
                                        </span>
                                    </div>

                                    {expanded === t.name ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                </button>

                                {/* Expanded details */}
                                {expanded === t.name && (
                                    <div className="border-t border-gray-100 bg-gray-50 p-4">
                                        {/* Rate bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                                                <span>نسبة الحضور</span>
                                                <span>{t.rate}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="h-full rounded-full" style={{
                                                    width: `${t.rate}%`,
                                                    backgroundColor: t.rate >= 80 ? '#10B981' : t.rate >= 50 ? '#F59E0B' : '#EF4444'
                                                }} />
                                            </div>
                                        </div>

                                        {/* Classes table */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="text-gray-500 border-b border-gray-200">
                                                        <th className="text-right py-2 px-2">اليوم</th>
                                                        <th className="text-right py-2 px-2">الوقت</th>
                                                        <th className="text-right py-2 px-2">المادة</th>
                                                        <th className="text-right py-2 px-2">القسم</th>
                                                        <th className="text-right py-2 px-2">القاعة</th>
                                                        <th className="text-right py-2 px-2">الحالة</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {t.classes.map((c, i) => {
                                                        const st = statusLabel(c.status);
                                                        return (
                                                            <tr key={i} className="border-b border-gray-100 last:border-0">
                                                                <td className="py-2 px-2 text-gray-700">{c.day}</td>
                                                                <td className="py-2 px-2 text-gray-700 font-mono">{c.time}</td>
                                                                <td className="py-2 px-2 text-gray-700">{c.subject}</td>
                                                                <td className="py-2 px-2 text-gray-700">{c.class}</td>
                                                                <td className="py-2 px-2 text-gray-700">{c.room}</td>
                                                                <td className="py-2 px-2">
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${st.cls}`}>
                                                                        {st.text}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </SupervisorLayout>
    );
};

const MiniStat = ({ icon, value, color }: { icon: React.ReactNode; value: number; color: string }) => (
    <div className={`flex items-center gap-1 text-xs font-medium ${color}`}>
        {icon}{value}
    </div>
);

export default TeacherProfilesPage;
