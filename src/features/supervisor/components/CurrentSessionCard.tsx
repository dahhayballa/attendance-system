import { useState } from 'react';
import { useCurrentSession } from '../hooks/useCurrentSession';
import { useAuth } from '../../auth/hooks/useAuth';
import { recordAttendance } from '../services/attendanceService';
import { useToast } from '../../../shared/hooks/useToast';
import { Clock, BookOpen, User, MapPin, Building, CheckCircle, XCircle, AlertTriangle, FileText, RefreshCw, AlertOctagon } from 'lucide-react';
import { Modal } from '../../../shared/components/ui/Modal';
import { InfoRow } from './ui/InfoRow';
import { StatusButton } from './ui/StatusButton';

interface CurrentSessionCardProps {
    onAttendanceRecorded?: () => void;
    className?: string;
}

const CurrentSessionCard = ({ onAttendanceRecorded, className = '' }: CurrentSessionCardProps) => {
    const { currentSession, nextSession, allCurrentSessions, timeRemaining, progress, loading, error, hasMultipleTeachers, refetch } = useCurrentSession();
    const { user } = useAuth();
    const { toast } = useToast();

    const [recording, setRecording] = useState<string | null>(null);
    const [modalState, setModalState] = useState<{ type: 'absent' | 'late' | 'notes' | null; scheduleId: string | null; value: any }>({ type: null, scheduleId: null, value: '' });

    const handleRecord = async (scheduleId: string, status: 'present' | 'absent' | 'late' | 'excused', extraNotes?: string) => {
        if (!user) return;
        try {
            setRecording(scheduleId);
            await recordAttendance(scheduleId, status, user.id, extraNotes);
            toast.success(status === 'present' ? 'تم تسجيل الحضور ✅' : status === 'absent' ? 'تم تسجيل الغياب' : status === 'late' ? 'تم تسجيل التأخر' : 'تم تسجيل الملاحظة');
            onAttendanceRecorded?.();
            refetch();
        } catch (err: any) {
            toast.error(err.message || 'فشل في التسجيل');
        } finally {
            setRecording(null);
            closeModal();
        }
    };

    const handlePresent = (id: string) => handleRecord(id, 'present');
    const openModal = (type: 'absent' | 'late' | 'notes', scheduleId: string) => setModalState({ type, scheduleId, value: type === 'late' ? 5 : '' });
    const closeModal = () => setModalState({ type: null, scheduleId: null, value: '' });

    const confirmModal = () => {
        const { type, scheduleId, value } = modalState;
        if (!scheduleId) return;
        if (type === 'absent') handleRecord(scheduleId, 'absent', value || undefined);
        if (type === 'late') handleRecord(scheduleId, 'late', `تأخر ${value} دقيقة`);
        if (type === 'notes' && value.trim()) handleRecord(scheduleId, 'excused', value);
    };

    if (loading) return <LoadingState className={className} />;
    if (error) return <ErrorState error={error} refetch={refetch} className={className} />;
    if (!currentSession) return <EmptyState nextSession={nextSession} className={className} />;

    return (
        <>
            <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden ${className}`}>
                <div className="bg-gradient-to-l from-blue-600 to-indigo-700 p-4 flex items-center justify-between">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Clock size={18} className="animate-pulse" /> الحصة الحالية
                    </h3>
                    <span className="text-white/90 text-sm font-mono" dir="ltr">{currentSession.time_start} — {currentSession.time_end}</span>
                </div>

                {hasMultipleTeachers && (
                    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-700 text-xs font-medium">
                        <AlertTriangle size={14} /> <span>تنبيه: {allCurrentSessions.length} أساتذة في نفس الفترة الزمنية</span>
                    </div>
                )}

                <div className="p-5">
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                        <InfoRow icon={<Building size={16} />} label="القسم" value={currentSession.class} />
                        <InfoRow icon={<BookOpen size={16} />} label="المادة" value={currentSession.subject} />
                        <InfoRow icon={<User size={16} />} label="الأستاذ" value={currentSession.teacher} highlight />
                        <InfoRow icon={<MapPin size={16} />} label="القاعة" value={currentSession.room || '—'} />
                        <InfoRow icon={<Clock size={16} />} label="متبقي" value={`${timeRemaining} دقيقة`} accent={timeRemaining <= 10 ? 'red' : timeRemaining <= 20 ? 'amber' : 'green'} />
                    </div>

                    <div className="mb-5">
                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                            <span>{currentSession.time_start}</span>
                            <span className="font-medium text-gray-600">{progress}%</span>
                            <span>{currentSession.time_end}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000 ease-linear bg-gradient-to-l from-blue-500 to-indigo-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <StatusButton icon={<CheckCircle size={18} />} label="حاضر" status="present" loading={recording === currentSession.id} onClick={() => handlePresent(currentSession.id)} />
                        <StatusButton icon={<XCircle size={18} />} label="غائب" status="absent" onClick={() => openModal('absent', currentSession.id)} />
                        <StatusButton icon={<AlertTriangle size={18} />} label="متأخر" status="late" onClick={() => openModal('late', currentSession.id)} />
                        <StatusButton icon={<FileText size={18} />} label="ملاحظة" status="excused" onClick={() => openModal('notes', currentSession.id)} />
                    </div>
                </div>

                {/* Multiple teachers list */}
                {hasMultipleTeachers && (
                    <div className="border-t border-gray-100 p-4">
                        <p className="text-xs text-gray-500 font-medium mb-2">أساتذة آخرون في نفس الفترة:</p>
                        <div className="space-y-2">
                            {allCurrentSessions.filter(s => s.id !== currentSession.id).map(session => (
                                <div key={session.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{session.teacher}</p>
                                        <p className="text-xs text-gray-500">{session.subject} — {session.class}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handlePresent(session.id)} disabled={recording === session.id} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50" title="حاضر"><CheckCircle size={16} /></button>
                                        <button onClick={() => openModal('absent', session.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="غائب"><XCircle size={16} /></button>
                                        <button onClick={() => openModal('late', session.id)} className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors" title="متأخر"><AlertTriangle size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {modalState.type && (
                <Modal title={modalState.type === 'absent' ? 'تسجيل غياب' : modalState.type === 'late' ? 'تسجيل تأخر' : 'إضافة ملاحظة'} onClose={closeModal}>
                    <div className="space-y-4">
                        {modalState.type === 'absent' && (
                            <textarea value={modalState.value} onChange={(e) => setModalState(s => ({ ...s, value: e.target.value }))} placeholder="سبب الغياب (اختياري)..." className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-red-200" rows={3} />
                        )}
                        {modalState.type === 'notes' && (
                            <textarea value={modalState.value} onChange={(e) => setModalState(s => ({ ...s, value: e.target.value }))} placeholder="اكتب الملاحظة هنا..." className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-blue-200" rows={4} autoFocus />
                        )}
                        {modalState.type === 'late' && (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setModalState(s => ({ ...s, value: Math.max(1, s.value - 5) }))} className="w-10 h-10 bg-gray-100 rounded-lg text-gray-600 font-bold hover:bg-gray-200 transition-colors">−</button>
                                <div className="flex-1 text-center">
                                    <input type="number" value={modalState.value} onChange={(e) => setModalState(s => ({ ...s, value: Math.max(1, parseInt(e.target.value) || 1) }))} className="w-20 text-center text-2xl font-bold text-amber-600 border-b-2 border-amber-300 outline-none" min={1} />
                                    <p className="text-xs text-gray-400 mt-1">دقيقة</p>
                                </div>
                                <button onClick={() => setModalState(s => ({ ...s, value: s.value + 5 }))} className="w-10 h-10 bg-gray-100 rounded-lg text-gray-600 font-bold hover:bg-gray-200 transition-colors">+</button>
                            </div>
                        )}
                        <div className="flex gap-2 mt-4">
                            <button onClick={confirmModal} className={`flex-1 py-2.5 text-white rounded-xl text-sm font-bold transition-colors ${modalState.type === 'absent' ? 'bg-red-500 hover:bg-red-600' : modalState.type === 'late' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'}`}>تأكيد</button>
                            <button onClick={closeModal} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">إلغاء</button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

// ══ Helpers ══
const LoadingState = ({ className }: { className: string }) => (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
        <div className="bg-gradient-to-l from-blue-600 to-indigo-700 p-4"><div className="h-5 bg-white/20 rounded w-48 animate-pulse" /></div>
        <div className="p-5 space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="flex items-center gap-3"><div className="w-5 h-5 bg-gray-200 rounded animate-pulse" /><div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" /></div>)}
            <div className="h-3 bg-gray-200 rounded-full w-full animate-pulse mt-4" />
        </div>
    </div>
);

const ErrorState = ({ error, refetch, className }: { error: string, refetch: () => void, className: string }) => (
    <div className={`bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden ${className}`}>
        <div className="bg-gradient-to-l from-red-500 to-red-600 p-4"><h3 className="text-white font-bold flex items-center gap-2"><AlertOctagon size={18} /> خطأ</h3></div>
        <div className="p-6 text-center">
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button onClick={refetch} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"><RefreshCw size={16} /> إعادة المحاولة</button>
        </div>
    </div>
);

const EmptyState = ({ nextSession, className }: { nextSession: any, className: string }) => (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
        <div className="bg-gradient-to-l from-gray-500 to-gray-600 p-4"><h3 className="text-white font-bold flex items-center gap-2"><Clock size={18} /> الحصة الحالية</h3></div>
        <div className="p-8 text-center">
            <h4 className="font-bold text-gray-700 mb-1">لا توجد حصة حالية</h4>
            {nextSession ? (
                <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-xs text-blue-500 font-medium mb-1">الحصة القادمة</p>
                    <p className="text-sm font-bold text-gray-800">{nextSession.teacher} — {nextSession.subject}</p>
                    <p className="text-xs text-gray-500 mt-1">{nextSession.time_start} - {nextSession.time_end} | {nextSession.class}</p>
                </div>
            ) : <p className="text-sm text-gray-400">لا توجد حصص متبقية لهذا اليوم</p>}
        </div>
    </div>
);

export default CurrentSessionCard;
