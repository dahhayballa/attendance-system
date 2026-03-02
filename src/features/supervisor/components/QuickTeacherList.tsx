import { useState } from 'react';
import { useTeacherStatus, type TeacherStatus } from '../hooks/useTeacherStatus';
import { useAuth } from '../../auth/hooks/useAuth';
import { recordAttendance } from '../services/attendanceService';
import { useToast } from '../../../shared/hooks/useToast';
import {
    Users, Search, RefreshCw, ChevronDown, ChevronUp,
    CheckCircle, XCircle, Clock, FileText
} from 'lucide-react';

/* ═══════════ Status Config ═══════════ */

const STATUS_CFG: Record<string, { dot: string; label: string; bg: string }> = {
    present: { dot: 'bg-green-500', label: 'حاضر', bg: 'bg-green-50' },
    absent: { dot: 'bg-red-500', label: 'غائب', bg: 'bg-red-50' },
    late: { dot: 'bg-amber-500', label: 'متأخر', bg: 'bg-amber-50' },
    excused: { dot: 'bg-gray-400', label: 'مبرر', bg: 'bg-gray-50' },
    pending: { dot: 'bg-gray-300', label: 'غير مسجل', bg: 'bg-white' },
};

/* ═══════════ Component ═══════════ */

interface QuickTeacherListProps {
    className?: string;
}

const QuickTeacherList = ({ className = '' }: QuickTeacherListProps) => {
    const { teachers, loading, error, refetch } = useTeacherStatus();
    const { user } = useAuth();
    const { toast } = useToast();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [recording, setRecording] = useState<string | null>(null);

    // Filter teachers
    const filtered = teachers.filter(t => {
        const matchesSearch = !search || t.teacher.includes(search) ||
            t.allClasses.some(c => c.subject.toLowerCase().includes(search.toLowerCase()) || c.class.includes(search));
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const displayed = showAll ? filtered : filtered.slice(0, 8);

    // Status counts
    const counts = {
        all: teachers.length,
        pending: teachers.filter(t => t.status === 'pending').length,
        present: teachers.filter(t => t.status === 'present').length,
        absent: teachers.filter(t => t.status === 'absent').length,
        late: teachers.filter(t => t.status === 'late').length,
    };

    // Quick record
    const handleRecord = async (scheduleId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
        if (!user) return;
        try {
            setRecording(scheduleId);
            await recordAttendance(scheduleId, status, user.id);
            toast.success(
                status === 'present' ? 'تم تسجيل الحضور ✅' :
                    status === 'absent' ? 'تم تسجيل الغياب' :
                        status === 'late' ? 'تم تسجيل التأخر' : 'تم التسجيل'
            );
            refetch();
        } catch (err: any) {
            toast.error(err.message || 'فشل في التسجيل');
        } finally {
            setRecording(null);
        }
    };

    return (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <Users size={18} className="text-teal-500" />
                    <h3 className="font-bold text-gray-900 text-sm">الأساتذة النشطون اليوم</h3>
                    <span className="text-xs text-gray-400">({teachers.length})</span>
                </div>
                <button onClick={refetch} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors" title="تحديث">
                    <RefreshCw size={14} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Search + Filter bar */}
            <div className="px-4 pt-3 pb-2 space-y-2">
                <div className="relative">
                    <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="بحث عن أستاذ..."
                        className="w-full pr-9 pl-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-300 focus:bg-white transition-all"
                    />
                </div>
                {/* Status filter chips */}
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {[
                        { key: 'all', label: 'الكل' },
                        { key: 'pending', label: '⚪ غير مسجل' },
                        { key: 'present', label: '🟢 حاضر' },
                        { key: 'absent', label: '🔴 غائب' },
                        { key: 'late', label: '🟡 متأخر' },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setStatusFilter(f.key)}
                            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${statusFilter === f.key
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {f.label} ({counts[f.key as keyof typeof counts] ?? 0})
                        </button>
                    ))}
                </div>
            </div>

            {/* Teacher list */}
            <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
                            <div className="w-2.5 h-2.5 bg-gray-200 rounded-full" />
                            <div className="flex-1">
                                <div className="h-3.5 bg-gray-200 rounded w-1/2 mb-1.5" />
                                <div className="h-3 bg-gray-100 rounded w-3/4" />
                            </div>
                        </div>
                    ))
                ) : error ? (
                    <div className="p-6 text-center">
                        <p className="text-red-500 text-xs mb-2">{error}</p>
                        <button onClick={refetch} className="text-xs text-blue-600 font-medium">إعادة المحاولة</button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">
                        لا يوجد أساتذة يطابقون البحث
                    </div>
                ) : (
                    displayed.map(teacher => (
                        <TeacherRow
                            key={teacher.teacher}
                            teacher={teacher}
                            expanded={expandedTeacher === teacher.teacher}
                            onToggle={() => setExpandedTeacher(
                                expandedTeacher === teacher.teacher ? null : teacher.teacher
                            )}
                            onRecord={handleRecord}
                            recording={recording}
                        />
                    ))
                )}
            </div>

            {/* Footer */}
            {filtered.length > 8 && (
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-center">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto"
                    >
                        {showAll ? (
                            <><ChevronUp size={12} /> عرض أقل</>
                        ) : (
                            <><ChevronDown size={12} /> عرض الكل ({filtered.length})</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

/* ═══════════ Teacher Row ═══════════ */

interface TeacherRowProps {
    teacher: TeacherStatus;
    expanded: boolean;
    onToggle: () => void;
    onRecord: (scheduleId: string, status: 'present' | 'absent' | 'late' | 'excused') => void;
    recording: string | null;
}

const TeacherRow = ({ teacher, expanded, onToggle, onRecord, recording }: TeacherRowProps) => {
    const cfg = STATUS_CFG[teacher.status] || STATUS_CFG.pending;
    const activeClass = teacher.currentClass || teacher.nextClass;
    const activeScheduleId = teacher.currentClass?.schedule_id || teacher.allClasses[0]?.schedule_id;

    return (
        <div className={`${expanded ? cfg.bg : 'hover:bg-gray-50'} transition-colors`}>
            {/* Main row */}
            <div className="px-4 py-3 flex items-start gap-3 cursor-pointer" onClick={onToggle}>
                {/* Status dot */}
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} mt-1.5 shrink-0`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900 truncate">{teacher.teacher}</p>
                        <span className="text-[10px] text-gray-400 shrink-0 mr-2">
                            {teacher.allClasses.length} حصة
                        </span>
                    </div>
                    {activeClass && (
                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                            {activeClass.class} — {activeClass.subject}
                            <span className="text-gray-400 mr-1">({activeClass.time})</span>
                        </p>
                    )}
                </div>

                {/* Quick action buttons (visible on hover / always on mobile) */}
                {activeScheduleId && teacher.status === 'pending' && (
                    <div className="flex gap-1 shrink-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); onRecord(activeScheduleId, 'present'); }}
                            disabled={recording === activeScheduleId}
                            className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border border-green-200 disabled:opacity-50"
                            title="حاضر"
                        >
                            {recording === activeScheduleId ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onRecord(activeScheduleId, 'absent'); }}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                            title="غائب"
                        >
                            <XCircle size={13} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onRecord(activeScheduleId, 'late'); }}
                            className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors border border-amber-200"
                            title="متأخر"
                        >
                            <Clock size={13} />
                        </button>
                    </div>
                )}

                {/* Status badge for recorded */}
                {teacher.status !== 'pending' && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${teacher.status === 'present' ? 'bg-green-100 text-green-700' :
                        teacher.status === 'absent' ? 'bg-red-100 text-red-700' :
                            teacher.status === 'late' ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-600'
                        }`}>
                        {cfg.label}
                    </span>
                )}

                {/* Expand icon */}
                <button className="p-0.5 shrink-0">
                    {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </button>
            </div>

            {/* Expanded: all classes */}
            {expanded && (
                <div className="px-4 pb-3 mr-5">
                    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                        {teacher.allClasses.map((cls, i) => {
                            const clsCfg = cls.status ? STATUS_CFG[cls.status] : STATUS_CFG.pending;
                            return (
                                <div key={i} className="flex items-center justify-between px-3 py-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-1.5 h-1.5 rounded-full ${clsCfg.dot} shrink-0`} />
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-medium text-gray-800 truncate">
                                                {cls.class} — {cls.subject}
                                            </p>
                                            <p className="text-[10px] text-gray-400">{cls.time} • {cls.room || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {cls.status ? (
                                            <span className="text-[10px] text-gray-500">{clsCfg.label}</span>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => onRecord(cls.schedule_id, 'present')}
                                                    disabled={recording === cls.schedule_id}
                                                    className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
                                                >
                                                    <CheckCircle size={11} />
                                                </button>
                                                <button
                                                    onClick={() => onRecord(cls.schedule_id, 'absent')}
                                                    className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                                                >
                                                    <XCircle size={11} />
                                                </button>
                                                <button
                                                    onClick={() => onRecord(cls.schedule_id, 'late')}
                                                    className="p-1 bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition-colors"
                                                >
                                                    <Clock size={11} />
                                                </button>
                                                <button
                                                    onClick={() => onRecord(cls.schedule_id, 'excused')}
                                                    className="p-1 bg-gray-50 text-gray-500 rounded hover:bg-gray-100 transition-colors"
                                                >
                                                    <FileText size={11} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickTeacherList;
