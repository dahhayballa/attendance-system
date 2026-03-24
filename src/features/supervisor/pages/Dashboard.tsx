import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { supabase } from '../../../services/supabase/client';
import SupervisorLayout from '../components/SupervisorLayout';
import CurrentSessionCard from '../components/CurrentSessionCard';
import {
    CheckCircle, XCircle, Clock, AlertTriangle,
    ChevronRight, BookOpen, MapPin, BarChart3
} from 'lucide-react';

const FR_DAYS = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const fmt = (t: string) => t?.slice(0, 5) ?? '';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
}

function getFrenchDate() {
    return new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats]             = useState({ total: 0, present: 0, absent: 0, late: 0, pending: 0 });
    const [nextSession, setNextSession] = useState<any>(null);
    const [loading, setLoading]         = useState(true);
    const [time, setTime]               = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const today  = FR_DAYS[new Date().getDay()];
            const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

            let query = supabase
                .from('schedules').select('*')
                .eq('day', today);

            if (user.role === 'supervisor' && user.name) {
                query = query.eq('pointer', user.name);
            }

            const { data } = await query;

            if (data) {
                const total   = data.length;
                const present = data.filter(s => s.status === 'present').length;
                const absent  = data.filter(s => s.status === 'absent').length;
                const late    = data.filter(s => s.status === 'late').length;
                setStats({ total, present, absent, late, pending: total - present - absent - late });

                const upcoming = data
                    .filter(s => {
                        const [h, m] = (s.time_start ?? '00:00').split(':').map(Number);
                        return h * 60 + m > nowMin;
                    })
                    .sort((a: any, b: any) => a.time_start.localeCompare(b.time_start));
                setNextSession(upcoming[0] ?? null);
            }
        } finally { setLoading(false); }
    }, [user?.name]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const recorded = stats.present + stats.absent + stats.late;
    const rate     = stats.total > 0 ? Math.round((recorded / stats.total) * 100) : 0;
    const timeStr  = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return (
        <SupervisorLayout>
            <div className="space-y-6 pb-8" dir="ltr">

                {/* ══ HERO CARD ══ */}
                <div className="relative overflow-hidden rounded-2xl p-6 text-gray-900 bg-white border border-orange-100 shadow-sm">

                    {/* Decorative glows */}
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <p className="text-sm font-bold text-orange-500 uppercase tracking-widest">{getGreeting()}</p>
                            <h1 className="text-3xl font-black mt-1 text-gray-900">
                                {user?.name?.split(' ').slice(0, 2).join(' ') ?? 'Superviseur'}
                            </h1>
                            <p className="text-sm mt-1 capitalize font-medium text-gray-500">
                                {getFrenchDate()}
                            </p>
                        </div>
                        <div className="text-right rounded-xl px-4 py-3 flex-shrink-0 bg-orange-50 border border-orange-100">
                            <p className="text-2xl font-mono font-black tabular-nums text-gray-900">{timeStr}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 text-orange-600">EETFP-MPG</p>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="relative z-10 mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex justify-between text-xs mb-2">
                            <span className="font-semibold text-gray-500">Progression du jour</span>
                            <span className="font-bold text-gray-900">
                                {loading ? '...' : `${recorded} / ${stats.total} séances`}
                            </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden bg-gray-200">
                            <div className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-orange-400 to-orange-500 shadow-sm"
                                style={{ width: `${loading ? 0 : rate}%` }} />
                        </div>
                        <p className="text-xs mt-2 font-medium text-gray-500 text-right">
                            {rate}% complété
                        </p>
                    </div>
                </div>

                {/* ══ STATS GRID ══ */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Présents',    value: stats.present, icon: CheckCircle,   bg: '#f0fdf4', border: '#bbf7d0', iconBg: '#16a34a', num: '#15803d' },
                        { label: 'Absents',     value: stats.absent,  icon: XCircle,       bg: '#fef2f2', border: '#fecaca', iconBg: '#dc2626', num: '#b91c1c' },
                        { label: 'En retard',   value: stats.late,    icon: Clock,         bg: '#fffbeb', border: '#fde68a', iconBg: '#d97706', num: '#b45309' },
                        { label: 'En attente',  value: stats.pending, icon: AlertTriangle, bg: '#f9fafb', border: '#e5e7eb', iconBg: '#6b7280', num: '#374151' },
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

                {/* ══ CURRENT SESSION ══ */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 rounded-full bg-orange-500" />
                            <h2 className="text-lg font-bold text-gray-900">Séance en cours</h2>
                        </div>
                        <button onClick={() => navigate('/supervisor/attendance')}
                            className="flex items-center gap-1 text-xs font-bold transition-colors hover:text-orange-600 text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg">
                            Voir tout <ChevronRight size={14} />
                        </button>
                    </div>
                    <CurrentSessionCard onAttendanceRecorded={fetchData} />
                </div>

                {/* ══ NEXT SESSION ══ */}
                {nextSession && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-6 rounded-full bg-blue-500" />
                            <h2 className="text-lg font-bold text-gray-900">Prochaine séance</h2>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-base">{nextSession.teacher}</p>
                                    <p className="text-sm font-medium text-gray-500 mt-1 truncate">{nextSession.subject}</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-50 text-gray-600 px-2.5 py-1.5 rounded-lg border border-gray-100">
                                            <BookOpen size={13} /> {nextSession.class}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-50 text-gray-600 px-2.5 py-1.5 rounded-lg border border-gray-100">
                                            <MapPin size={13} /> {nextSession.room}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    <div className="rounded-xl px-4 py-3 text-center bg-orange-50 border border-orange-100 shadow-sm">
                                        <p className="text-xl font-black font-mono text-orange-600">
                                            {fmt(nextSession.time_start)}
                                        </p>
                                        <p className="text-[10px] font-bold text-orange-500/80 uppercase tracking-widest mt-1">début</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ QUICK ACTIONS ══ */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-6 rounded-full bg-gray-400" />
                        <h2 className="text-lg font-bold text-gray-900">Accès rapide</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Enregistrement', sub: 'Toutes les séances', path: '/supervisor/attendance',         icon: CheckCircle, primary: true  },
                            { label: 'Statistiques',   sub: 'Analyses & chiffres',path: '/supervisor/statistics',         icon: BarChart3,   primary: false },
                            { label: 'Historique',     sub: 'Archive complète',   path: '/supervisor/attendance/records', icon: BookOpen,    primary: false },
                        ].map(({ label, sub, path, icon: Icon, primary }) => (
                            <button key={path} onClick={() => navigate(path)}
                                className={`rounded-2xl p-4 text-left transition-all active:scale-95 group border ${
                                    primary ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md shadow-orange-500/20 border-transparent' 
                                            : 'bg-white text-gray-900 border-gray-200 hover:border-orange-300 hover:shadow-sm'
                                }`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                                    primary ? 'bg-white/20' : 'bg-orange-50 group-hover:bg-orange-100'
                                }`}>
                                    <Icon size={18} className={primary ? 'text-white' : 'text-orange-500'} />
                                </div>
                                <p className={`font-bold text-sm leading-tight ${primary ? 'text-white' : 'text-gray-900'}`}>{label}</p>
                                <p className={`text-xs mt-1.5 font-medium ${primary ? 'text-white/80' : 'text-gray-500'}`}>
                                    {sub}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </SupervisorLayout>
    );
};

export default Dashboard;