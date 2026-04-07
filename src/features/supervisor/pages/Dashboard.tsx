import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../services/supabase/client';
import { useActiveWeek } from '../../../shared/hooks/useActiveWeek';
import SupervisorLayout from '../components/SupervisorLayout';
import {
    CheckCircle, XCircle, Clock, AlertTriangle,
    ChevronRight
} from 'lucide-react';

const SCHOOL_TIMEZONE = 'Africa/Nouakchott';
const normalizeText = (value?: string | null): string =>
    (value || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
const normalizeDay = (value: string): string => {
    const v = (value || '')
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const map: Record<string, string> = {
        dimanche: 'dimanche',
        sunday: 'dimanche',
        'الاحد': 'dimanche',
        'الأحد': 'dimanche',
        lundi: 'lundi',
        monday: 'lundi',
        'الاثنين': 'lundi',
        'الإثنين': 'lundi',
        mardi: 'mardi',
        tuesday: 'mardi',
        'الثلاثاء': 'mardi',
        mercredi: 'mercredi',
        wednesday: 'mercredi',
        'الاربعاء': 'mercredi',
        'الأربعاء': 'mercredi',
        jeudi: 'jeudi',
        thursday: 'jeudi',
        'الخميس': 'jeudi',
        vendredi: 'vendredi',
        friday: 'vendredi',
        'الجمعة': 'vendredi',
        samedi: 'samedi',
        saturday: 'samedi',
        'السبت': 'samedi',
    };
    return map[v] ?? v;
};
const getSchoolDayName = (): string => {
    const enDay = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        timeZone: SCHOOL_TIMEZONE,
    }).format(new Date());
    const map: Record<string, string> = {
        Sunday: 'Dimanche',
        Monday: 'Lundi',
        Tuesday: 'Mardi',
        Wednesday: 'Mercredi',
        Thursday: 'Jeudi',
        Friday: 'Vendredi',
        Saturday: 'Samedi',
    };
    return map[enDay] || 'Lundi';
};
function getLocalizedDate(lang: string) {
    const locale = lang === 'ar' ? 'ar-EG' : 'fr-FR';
    return new Date().toLocaleDateString(locale, {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}

const Dashboard = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { activeWeek } = useActiveWeek();
    const [stats, setStats]             = useState({ total: 0, present: 0, absent: 0, late: 0, pending: 0 });
    const [loading, setLoading]         = useState(true);
    const [time, setTime]               = useState(new Date());

    const isRtl = i18n.language === 'ar';
    const getGreetingObj = () => {
        const h = new Date().getHours();
        if (h < 12) return t('supervisor.dashboard.greetingMorning');
        if (h < 18) return t('supervisor.dashboard.greetingAfternoon');
        return t('supervisor.dashboard.greetingEvening');
    };

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const today  = getSchoolDayName();
            const todayNormalized = normalizeDay(today);

            let query = supabase
                .from('schedules').select('*')
                .order('time_start', { ascending: true });

            const { data: schedsRaw } = await query;
            let scheds = (schedsRaw || []).filter((s: any) => normalizeDay(s.day) === todayNormalized);

            if ((user.role === 'supervisor' || user.role === 'surveillance') && user.name) {
                const byPointer = scheds.filter((s: any) => normalizeText(s.pointer) === normalizeText(user.name));
                if (byPointer.length > 0) {
                    scheds = byPointer;
                }
            }

            if (scheds && scheds.length > 0) {
                const total = scheds.length;
                const scheduleIds = scheds.map(s => s.id);
                
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);

                const { data: logsData } = await supabase
                    .from('attendance_logs')
                    .select('schedule_id, status')
                    .in('schedule_id', scheduleIds)
                    .gte('recorded_at', startOfToday.toISOString())
                    .order('recorded_at', { ascending: false });

                const uniqueLogs = new Map<string, string>();
                logsData?.forEach((log: any) => {
                    if (!uniqueLogs.has(log.schedule_id)) uniqueLogs.set(log.schedule_id, log.status);
                });

                const present = Array.from(uniqueLogs.values()).filter(s => s === 'present' || s === 'completed').length;
                const absent = Array.from(uniqueLogs.values()).filter(s => s === 'absent').length;
                const late = Array.from(uniqueLogs.values()).filter(s => s === 'late').length;

                setStats({ total, present, absent, late, pending: total - present - absent - late });
            } else {
                setStats({ total: 0, present: 0, absent: 0, late: 0, pending: 0 });
            }
        } finally { setLoading(false); }
    }, [user?.name, activeWeek?.id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const recorded = stats.present + stats.absent + stats.late;
    const rate     = stats.total > 0 ? Math.round((recorded / stats.total) * 100) : 0;
    const timeStr  = time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    return (
        <SupervisorLayout>
            <div className={`space-y-6 pb-8 ${isRtl ? 'font-arabic' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>

                {/* ══ HERO CARD ══ */}
                <div className="relative overflow-hidden rounded-xl p-4 text-gray-900 bg-white border border-orange-100 shadow-sm">

                    {/* Decorative glows */}
                    <div className={`absolute top-0 ${isRtl ? 'left-0' : 'right-0'} w-48 h-48 rounded-full pointer-events-none`}
                        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                    <div className={`absolute bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-32 h-32 rounded-full pointer-events-none`}
                        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">{getGreetingObj()}</p>
                            <h1 className="text-xl font-black mt-1 text-gray-900 flex items-center gap-2">
                                <span className="p-1.5 bg-orange-100 rounded-lg text-orange-500 text-lg leading-none">👋</span>
                                {user?.name?.split(' ').slice(0, 2).join(' ') ?? t('supervisor.dashboard.supervisor')}
                            </h1>
                            <p className="text-xs mt-1 capitalize font-medium text-gray-500">
                                {getLocalizedDate(i18n.language)}
                            </p>
                        </div>
                        <div className={`text-center rounded-lg px-3 py-2 flex-shrink-0 bg-orange-50 border border-orange-100 ${isRtl ? 'mr-4' : 'ml-4'}`}>
                            <p className="text-lg font-mono font-black tabular-nums text-gray-900 leading-none">{timeStr}</p>
                            <hr className="border-orange-100 my-1" />
                            <p className="text-[9px] font-bold uppercase tracking-wider text-orange-600">{t('supervisor.dashboard.schoolName')}</p>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="relative z-10 mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex justify-between text-xs mb-2">
                            <span className="font-semibold text-gray-500">{t('supervisor.dashboard.progressToday')}</span>
                            <span className="font-bold text-gray-900">
                                {loading ? '...' : `${recorded} / ${t('supervisor.dashboard.sessionsCount', { count: stats.total })}`}
                            </span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden bg-gray-200 ${isRtl ? 'flex flex-row-reverse' : ''}`}>
                            <div className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-orange-400 to-orange-500 shadow-sm"
                                style={{ width: `${loading ? 0 : rate}%` }} />
                        </div>
                        <p className={`text-xs mt-2 font-medium text-gray-500 ${isRtl ? 'text-left' : 'text-right'}`}>
                            {rate}% {t('supervisor.dashboard.progressRate')}
                        </p>
                    </div>
                </div>

                {/* ══ STATS GRID ══ */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: t('supervisor.dashboard.statsPresent'),    value: stats.present, icon: CheckCircle,   bg: '#f0fdf4', border: '#bbf7d0', iconBg: '#16a34a', num: '#15803d' },
                        { label: t('supervisor.dashboard.statsAbsent'),     value: stats.absent,  icon: XCircle,       bg: '#fef2f2', border: '#fecaca', iconBg: '#dc2626', num: '#b91c1c' },
                        { label: t('supervisor.dashboard.statsLate'),   value: stats.late,    icon: Clock,         bg: '#fffbeb', border: '#fde68a', iconBg: '#d97706', num: '#b45309' },
                        { label: t('supervisor.dashboard.statsPending'),  value: stats.pending, icon: AlertTriangle, bg: '#f9fafb', border: '#e5e7eb', iconBg: '#6b7280', num: '#374151' },
                    ].map(({ label, value, icon: Icon, bg, border, iconBg, num }) => (
                        <div key={label} className="rounded-2xl p-4 flex items-center gap-3"
                            style={{ background: bg, border: `1px solid ${border}` }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: iconBg, boxShadow: `0 2px 8px ${iconBg}40` }}>
                                <Icon size={18} color="#fff" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500">{label}</p>
                                <p className="text-2xl font-black" style={{ color: num }}>
                                    {loading ? '–' : value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* <div className="flex justify-center pt-4">
                    <button onClick={() => navigate('/supervisor/now')}
                        className={`flex items-center gap-2 font-bold text-white bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-xl transition-colors shadow-sm ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                        <span>Gérer les présences en cours</span>
                        <ChevronRight size={18} className={isRtl ? 'rotate-180' : ''} />
                    </button>
                </div> */}

            </div>
        </SupervisorLayout>
    );
};

export default Dashboard;