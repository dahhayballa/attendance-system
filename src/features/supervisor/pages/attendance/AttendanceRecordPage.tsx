import { useState, useEffect, useCallback } from 'react';
import SupervisorLayout from '../../components/SupervisorLayout';
import CurrentSessionCard from '../../components/CurrentSessionCard';
import { supabase } from '../../../../services/supabase/client';
import { useAuth } from '../../../auth/hooks/useAuth';
import { CheckCircle, XCircle, Clock, AlertTriangle, Users, RefreshCw } from 'lucide-react';

const AttendanceRecordPage = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, pending: 0 });
    const [loading, setLoading] = useState(true);

    const fetchSummary = useCallback(async () => {
        try {
            setLoading(true);
            const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            const today = days[new Date().getDay()];

            let query = supabase.from('schedules').select('status').eq('day', today);
            if (user?.role === 'supervisor' && user?.name) {
                query = query.eq('pointer', user.name);
            }
            const { data } = await query;

            if (data) {
                const total   = data.length;
                const present = data.filter(s => s.status === 'present').length;
                const absent  = data.filter(s => s.status === 'absent').length;
                const late    = data.filter(s => s.status === 'late').length;
                setSummary({ total, present, absent, late, pending: total - present - absent - late });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user?.role, user?.name]);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);

    const recorded = summary.present + summary.absent + summary.late;
    const rate = summary.total > 0 ? Math.round((recorded / summary.total) * 100) : 0;

    return (
        <SupervisorLayout>
            <div className="space-y-6" dir="rtl">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">تسجيل الحضور</h2>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {new Date().toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    <button
                        onClick={fetchSummary}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        تحديث
                    </button>
                </div>

                {/* ── Stats cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                        { icon: Users,         label: 'إجمالي',     value: summary.total,   bg: 'bg-gray-50',   text: 'text-gray-700',   border: 'border-gray-200'  },
                        { icon: CheckCircle,   label: 'حاضر',       value: summary.present, bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
                        { icon: XCircle,       label: 'غائب',       value: summary.absent,  bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'   },
                        { icon: Clock,         label: 'متأخر',      value: summary.late,    bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
                        { icon: AlertTriangle, label: 'في الانتظار', value: summary.pending, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200'},
                    ].map(({ icon: Icon, label, value, bg, text, border }) => (
                        <div key={label} className={`rounded-xl border p-4 ${bg} ${border}`}>
                            <div className={`flex items-center gap-1.5 mb-2 ${text}`}>
                                <Icon size={15} />
                                <span className="text-xs font-medium">{label}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                                {loading ? '...' : value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Progress ── */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">نسبة الإنجاز</span>
                        <span className={`text-xl font-black ${rate >= 80 ? 'text-green-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {rate}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${rate}%`,
                                backgroundColor: rate >= 80 ? '#16a34a' : rate >= 50 ? '#d97706' : '#dc2626'
                            }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                        تم تسجيل {recorded} من أصل {summary.total} حصة
                    </p>
                </div>

                {/* ── Current session ── */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-6 bg-green-600 rounded-full" />
                        <h3 className="text-base font-bold text-gray-900">الحصة الحالية</h3>
                    </div>
                    <CurrentSessionCard onAttendanceRecorded={fetchSummary} />
                </div>

            </div>
        </SupervisorLayout>
    );
};

export default AttendanceRecordPage;