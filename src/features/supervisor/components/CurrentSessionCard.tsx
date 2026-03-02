import { useState } from 'react';
import { useCurrentSession } from '../hooks/useCurrentSession';
import { useAuth } from '../../auth/hooks/useAuth';
import { recordAttendance } from '../services/attendanceService';
import { useToast } from '../../../shared/hooks/useToast';
import {
    Clock, BookOpen, User, MapPin, Building,
    CheckCircle, XCircle, AlertTriangle, FileText,
    RefreshCw, ChevronLeft, AlertOctagon
} from 'lucide-react';

interface CurrentSessionCardProps {
    onAttendanceRecorded?: () => void;
    className?: string;
}

const CurrentSessionCard = ({ onAttendanceRecorded, className = '' }: CurrentSessionCardProps) => {
    const {
        currentSession, nextSession, allCurrentSessions,
        timeRemaining, progress, loading, error,
        hasMultipleTeachers, refetch
    } = useCurrentSession();
    const { user } = useAuth();
    const { toast } = useToast();

    const [recording, setRecording] = useState<string | null>(null);
    const [showAbsentModal, setShowAbsentModal] = useState(false);
    const [showLateModal, setShowLateModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [absentReason, setAbsentReason] = useState('');
    const [lateMinutes, setLateMinutes] = useState(5);
    const [notes, setNotes] = useState('');
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

    // ═══ Handlers ═══
    const handleRecord = async (scheduleId: string, status: 'present' | 'absent' | 'late' | 'excused', extraNotes?: string) => {
        if (!user) return;
        try {
            setRecording(scheduleId);
            await recordAttendance(scheduleId, status, user.id, extraNotes);
            toast.success(
                status === 'present' ? 'تم تسجيل الحضور ✅' :
                    status === 'absent' ? 'تم تسجيل الغياب' :
                        status === 'late' ? 'تم تسجيل التأخر' : 'تم تسجيل الملاحظة'
            );
            onAttendanceRecorded?.();
            refetch();
        } catch (err: any) {
            toast.error(err.message || 'فشل في التسجيل');
        } finally {
            setRecording(null);
        }
    };

    const handlePresent = (scheduleId: string) => handleRecord(scheduleId, 'present');

    const openAbsentModal = (scheduleId: string) => {
        setSelectedScheduleId(scheduleId);
        setAbsentReason('');
        setShowAbsentModal(true);
    };

    const confirmAbsent = () => {
        if (selectedScheduleId) {
            handleRecord(selectedScheduleId, 'absent', absentReason || undefined);
        }
        setShowAbsentModal(false);
    };

    const openLateModal = (scheduleId: string) => {
        setSelectedScheduleId(scheduleId);
        setLateMinutes(5);
        setShowLateModal(true);
    };

    const confirmLate = () => {
        if (selectedScheduleId) {
            handleRecord(selectedScheduleId, 'late', `تأخر ${lateMinutes} دقيقة`);
        }
        setShowLateModal(false);
    };

    const openNotesModal = (scheduleId: string) => {
        setSelectedScheduleId(scheduleId);
        setNotes('');
        setShowNotesModal(true);
    };

    const confirmNotes = () => {
        if (selectedScheduleId && notes.trim()) {
            handleRecord(selectedScheduleId, 'excused', notes);
        }
        setShowNotesModal(false);
    };

    // ═══ Loading State ═══
    if (loading) {
        return (
            <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
                <div className="bg-gradient-to-l from-blue-600 to-indigo-700 p-4">
                    <div className="h-5 bg-white/20 rounded w-48 animate-pulse" />
                </div>
                <div className="p-5 space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                        </div>
                    ))}
                    <div className="h-3 bg-gray-200 rounded-full w-full animate-pulse mt-4" />
                    <div className="grid grid-cols-4 gap-2 mt-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ═══ Error State ═══
    if (error) {
        return (
            <div className={`bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden ${className}`}>
                <div className="bg-gradient-to-l from-red-500 to-red-600 p-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <AlertOctagon size={18} />
                        خطأ في تحميل الحصة
                    </h3>
                </div>
                <div className="p-6 text-center">
                    <p className="text-gray-500 text-sm mb-4">{error}</p>
                    <button
                        onClick={refetch}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                        <RefreshCw size={16} />
                        إعادة المحاولة
                    </button>
                </div>
            </div>
        );
    }

    // ═══ No Current Session ═══
    if (!currentSession) {
        return (
            <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
                <div className="bg-gradient-to-l from-gray-500 to-gray-600 p-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Clock size={18} />
                        الحصة الحالية
                    </h3>
                </div>
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock size={28} className="text-gray-400" />
                    </div>
                    <h4 className="font-bold text-gray-700 mb-1">لا توجد حصة حالية</h4>
                    {nextSession ? (
                        <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <p className="text-xs text-blue-500 font-medium mb-1">الحصة القادمة</p>
                            <p className="text-sm font-bold text-gray-800">
                                {nextSession.teacher} — {nextSession.subject}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {nextSession.time_start} - {nextSession.time_end} | {nextSession.class}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">لا توجد حصص متبقية لهذا اليوم</p>
                    )}
                </div>
            </div>
        );
    }

    // ═══ Active Session ═══
    return (
        <>
            <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden ${className}`}>
                {/* Header gradient */}
                <div className="bg-gradient-to-l from-blue-600 to-indigo-700 p-4 flex items-center justify-between">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Clock size={18} className="animate-pulse" />
                        الحصة الحالية
                    </h3>
                    <span className="text-white/90 text-sm font-mono" dir="ltr">
                        {currentSession.time_start} — {currentSession.time_end}
                    </span>
                </div>

                {/* Multi-teacher warning */}
                {hasMultipleTeachers && (
                    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-700 text-xs font-medium">
                        <AlertTriangle size={14} />
                        <span>تنبيه: {allCurrentSessions.length} أساتذة في نفس الفترة الزمنية</span>
                    </div>
                )}

                {/* Session details */}
                <div className="p-5">
                    {/* Info grid */}
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                        <InfoRow icon={<Building size={16} />} label="القسم" value={currentSession.class} />
                        <InfoRow icon={<BookOpen size={16} />} label="المادة" value={currentSession.subject} />
                        <InfoRow icon={<User size={16} />} label="الأستاذ" value={currentSession.teacher} highlight />
                        <InfoRow icon={<MapPin size={16} />} label="القاعة" value={currentSession.room || '—'} />
                        <InfoRow
                            icon={<Clock size={16} />}
                            label="متبقي"
                            value={`${timeRemaining} دقيقة`}
                            accent={timeRemaining <= 10 ? 'red' : timeRemaining <= 20 ? 'amber' : 'green'}
                        />
                    </div>

                    {/* Progress bar */}
                    <div className="mb-5">
                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                            <span>{currentSession.time_start}</span>
                            <span className="font-medium text-gray-600">{progress}%</span>
                            <span>{currentSession.time_end}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-linear bg-gradient-to-l from-blue-500 to-indigo-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Status buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <StatusButton
                            icon={<CheckCircle size={18} />}
                            label="حاضر"
                            color="green"
                            loading={recording === currentSession.id}
                            onClick={() => handlePresent(currentSession.id)}
                        />
                        <StatusButton
                            icon={<XCircle size={18} />}
                            label="غائب"
                            color="red"
                            onClick={() => openAbsentModal(currentSession.id)}
                        />
                        <StatusButton
                            icon={<AlertTriangle size={18} />}
                            label="متأخر"
                            color="amber"
                            onClick={() => openLateModal(currentSession.id)}
                        />
                        <StatusButton
                            icon={<FileText size={18} />}
                            label="ملاحظة"
                            color="blue"
                            onClick={() => openNotesModal(currentSession.id)}
                        />
                    </div>
                </div>

                {/* Multiple teachers list */}
                {hasMultipleTeachers && (
                    <div className="border-t border-gray-100 p-4">
                        <p className="text-xs text-gray-500 font-medium mb-2">أساتذة آخرون في نفس الفترة:</p>
                        <div className="space-y-2">
                            {allCurrentSessions.filter(s => s.id !== currentSession.id).map(session => (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{session.teacher}</p>
                                        <p className="text-xs text-gray-500">{session.subject} — {session.class}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handlePresent(session.id)}
                                            disabled={recording === session.id}
                                            className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                                            title="حاضر"
                                        >
                                            <CheckCircle size={16} />
                                        </button>
                                        <button
                                            onClick={() => openAbsentModal(session.id)}
                                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                            title="غائب"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                        <button
                                            onClick={() => openLateModal(session.id)}
                                            className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                                            title="متأخر"
                                        >
                                            <AlertTriangle size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════ Modals ═══════════ */}

            {/* Absent Modal */}
            {showAbsentModal && (
                <Modal title="تسجيل غياب" onClose={() => setShowAbsentModal(false)}>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">هل تريد إضافة سبب الغياب؟ (اختياري)</p>
                        <textarea
                            value={absentReason}
                            onChange={(e) => setAbsentReason(e.target.value)}
                            placeholder="سبب الغياب..."
                            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none resize-none"
                            rows={3}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={confirmAbsent}
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
                            >
                                تأكيد الغياب
                            </button>
                            <button
                                onClick={() => setShowAbsentModal(false)}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Late Modal */}
            {showLateModal && (
                <Modal title="تسجيل تأخر" onClose={() => setShowLateModal(false)}>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">كم دقيقة تأخر الأستاذ؟</p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setLateMinutes(Math.max(1, lateMinutes - 5))}
                                className="w-10 h-10 bg-gray-100 rounded-lg text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                            >
                                −
                            </button>
                            <div className="flex-1 text-center">
                                <input
                                    type="number"
                                    value={lateMinutes}
                                    onChange={(e) => setLateMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-20 text-center text-2xl font-bold text-amber-600 border-b-2 border-amber-300 outline-none"
                                    min={1}
                                />
                                <p className="text-xs text-gray-400 mt-1">دقيقة</p>
                            </div>
                            <button
                                onClick={() => setLateMinutes(lateMinutes + 5)}
                                className="w-10 h-10 bg-gray-100 rounded-lg text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                            >
                                +
                            </button>
                        </div>
                        <div className="flex gap-2 mt-2">
                            {[5, 10, 15, 20, 30].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setLateMinutes(m)}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${lateMinutes === m
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {m}د
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={confirmLate}
                                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors"
                            >
                                تأكيد التأخر
                            </button>
                            <button
                                onClick={() => setShowLateModal(false)}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Notes Modal */}
            {showNotesModal && (
                <Modal title="إضافة ملاحظة" onClose={() => setShowNotesModal(false)}>
                    <div className="space-y-4">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="اكتب الملاحظة هنا..."
                            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none resize-none"
                            rows={4}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={confirmNotes}
                                disabled={!notes.trim()}
                                className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                حفظ الملاحظة
                            </button>
                            <button
                                onClick={() => setShowNotesModal(false)}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

/* ═══════════════════════════ */
/*  Sub-components             */
/* ═══════════════════════════ */

interface InfoRowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    highlight?: boolean;
    accent?: 'green' | 'amber' | 'red';
}

const InfoRow = ({ icon, label, value, highlight, accent }: InfoRowProps) => {
    const accentColors = {
        green: 'text-green-600 bg-green-50 px-2 py-0.5 rounded-md',
        amber: 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md',
        red: 'text-red-600 bg-red-50 px-2 py-0.5 rounded-md',
    };

    return (
        <div className="flex items-center gap-3">
            <div className="text-gray-400 shrink-0">{icon}</div>
            <span className="text-xs text-gray-500 w-14 shrink-0">{label}</span>
            <span className={`text-sm ${accent ? accentColors[accent] :
                    highlight ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                }`}>
                {value}
            </span>
        </div>
    );
};

interface StatusButtonProps {
    icon: React.ReactNode;
    label: string;
    color: 'green' | 'red' | 'amber' | 'blue';
    onClick: () => void;
    loading?: boolean;
}

const statusColors = {
    green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300',
    red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300',
};

const StatusButton = ({ icon, label, color, onClick, loading }: StatusButtonProps) => (
    <button
        onClick={onClick}
        disabled={loading}
        className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-sm font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${statusColors[color]}`}
    >
        {loading ? <RefreshCw size={16} className="animate-spin" /> : icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal = ({ title, onClose, children }: ModalProps) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">{title}</h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronLeft size={18} className="text-gray-400" />
                </button>
            </div>
            {children}
        </div>
    </div>
);

export default CurrentSessionCard;
