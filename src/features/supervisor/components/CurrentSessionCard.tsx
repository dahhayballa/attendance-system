import { useState } from 'react';
import { useCurrentSession } from '../hooks/useCurrentSession';
import { useAuth } from '../../auth/hooks/useAuth';
import { recordAttendance } from '../services/attendanceService';
import { useToast } from '../../../shared/hooks/useToast';
import { Clock, BookOpen, User, MapPin, Building, CheckCircle, XCircle, AlertTriangle, FileText, RefreshCw, AlertOctagon } from 'lucide-react';
import { Modal } from '../../../shared/components/ui/Modal';

interface CurrentSessionCardProps {
    onAttendanceRecorded?: () => void;
    className?: string;
}

const fmt = (t: string) => t?.slice(0, 5) ?? '';

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
            toast.success(
                status === 'present' ? '✅ Présence enregistrée' :
                status === 'absent'  ? '❌ Absence enregistrée' :
                status === 'late'    ? '⏰ Retard enregistré' : '📝 Motif enregistré'
            );
            onAttendanceRecorded?.();
            refetch();
        } catch (err: any) {
            toast.error(err.message || 'Échec de l\'enregistrement');
        } finally {
            setRecording(null);
            closeModal();
        }
    };

    const handlePresent = (id: string) => handleRecord(id, 'present');
    const openModal = (type: 'absent' | 'late' | 'notes', scheduleId: string) =>
        setModalState({ type, scheduleId, value: type === 'late' ? 5 : '' });
    const closeModal = () => setModalState({ type: null, scheduleId: null, value: '' });

    const confirmModal = () => {
        const { type, scheduleId, value } = modalState;
        if (!scheduleId) return;
        if (type === 'absent') handleRecord(scheduleId, 'absent', value || undefined);
        if (type === 'late')   handleRecord(scheduleId, 'late', `Retard ${value} minutes`);
        if (type === 'notes' && value.trim()) handleRecord(scheduleId, 'excused', value);
    };

    if (loading) return <LoadingState className={className} />;
    if (error)   return <ErrorState error={error} refetch={refetch} className={className} />;
    if (!currentSession) return <EmptyState nextSession={nextSession} className={className} />;

    return (
        <>
            <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`} dir="ltr">

                {/* ── Header ── */}
                <div className="bg-slate-800 px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <Clock size={18} className="animate-pulse text-orange-500" />
                        <span className="font-bold text-base">Session en Cours</span>
                    </div>
                    <span className="text-white/90 text-sm font-mono bg-white/10 px-3 py-1 rounded-lg">
                        {fmt(currentSession.time_start)} — {fmt(currentSession.time_end)}
                    </span>
                </div>

                {/* ── Warning: multiple teachers ── */}
                {hasMultipleTeachers && (
                    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-700 text-xs font-medium">
                        <AlertTriangle size={14} />
                        <span>{allCurrentSessions.length} professeurs dans ce créneau</span>
                    </div>
                )}

                <div className="p-5">
                    {/* ── Session info ── */}
                    <div className="bg-gray-50 rounded-xl border border-gray-100 mb-5 overflow-hidden">
                        {[
                            { icon: <Building size={15} />,  label: 'Classe',   value: currentSession.class },
                            { icon: <BookOpen size={15} />,  label: 'Matière',  value: currentSession.subject },
                            { icon: <User size={15} />,      label: 'Professeur', value: currentSession.teacher, bold: true },
                            { icon: <MapPin size={15} />,    label: 'Salle',  value: currentSession.room || '—' },
                            { icon: <Clock size={15} />,     label: 'Restant',
                              value: `${timeRemaining} min`,
                              color: timeRemaining <= 10 ? 'text-red-600' : timeRemaining <= 20 ? 'text-amber-600' : 'text-green-600'
                            },
                        ].map(({ icon, label, value, bold, color }, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 last:border-0">
                                <div className="flex items-center gap-2 text-gray-400">
                                    {icon}
                                    <span className="text-xs text-gray-500">{label}</span>
                                </div>
                                <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-700'} ${color ?? ''}`}>
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* ── Progress bar ── */}
                    <div className="mb-5">
                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                            <span>{fmt(currentSession.time_start)}</span>
                            <span className="font-semibold text-gray-600">{progress}%</span>
                            <span>{fmt(currentSession.time_end)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-orange-500 transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* ── Action buttons ── */}
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { label: 'Présent',   status: 'present', icon: <CheckCircle size={16} />,  cls: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200', onClick: () => handlePresent(currentSession.id) },
                            { label: 'Absent',   status: 'absent',  icon: <XCircle size={16} />,      cls: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',       onClick: () => openModal('absent', currentSession.id) },
                            { label: 'Retard',  status: 'late',    icon: <AlertTriangle size={16} />, cls: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200', onClick: () => openModal('late', currentSession.id) },
                            { label: 'Motif', status: 'excused', icon: <FileText size={16} />,     cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',   onClick: () => openModal('notes', currentSession.id) },
                        ].map(({ label, status, icon, cls, onClick }) => (
                            <button
                                key={status}
                                onClick={onClick}
                                disabled={recording === currentSession.id}
                                className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 ${cls}`}
                            >
                                {icon}
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Other teachers ── */}
                {hasMultipleTeachers && (
                    <div className="border-t border-gray-100 px-5 py-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                            Autres professeurs dans ce créneau
                        </p>
                        <div className="space-y-2">
                            {allCurrentSessions
                                .filter(s => s.id !== currentSession.id)
                                .map(session => (
                                    <div key={session.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{session.teacher}</p>
                                            <p className="text-xs text-gray-400 truncate">{session.subject} — {session.class}</p>
                                        </div>
                                        <div className="flex gap-1.5 flex-shrink-0 ml-3">
                                            <button onClick={() => handlePresent(session.id)} disabled={recording === session.id}
                                                className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50" title="Présent">
                                                <CheckCircle size={15} />
                                            </button>
                                            <button onClick={() => openModal('absent', session.id)}
                                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Absent">
                                                <XCircle size={15} />
                                            </button>
                                            <button onClick={() => openModal('late', session.id)}
                                                className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors" title="Retard">
                                                <AlertTriangle size={15} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            {modalState.type && (
                <Modal
                    title={modalState.type === 'absent' ? 'Enregistrer Absence' : modalState.type === 'late' ? 'Enregistrer Retard' : 'Ajouter Motif'}
                    onClose={closeModal}
                >
                    <div className="space-y-4" dir="ltr">
                        {modalState.type === 'absent' && (
                            <textarea
                                value={modalState.value}
                                onChange={e => setModalState(s => ({ ...s, value: e.target.value }))}
                                placeholder="Raison de l'absence (optionnelle)..."
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-red-200"
                                rows={3}
                            />
                        )}
                        {modalState.type === 'notes' && (
                            <textarea
                                value={modalState.value}
                                onChange={e => setModalState(s => ({ ...s, value: e.target.value }))}
                                placeholder="Écrire le motif ici..."
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-blue-200"
                                rows={4} autoFocus
                            />
                        )}
                        {modalState.type === 'late' && (
                            <div className="flex items-center justify-center gap-4">
                                <button onClick={() => setModalState(s => ({ ...s, value: Math.max(1, s.value - 5) }))}
                                    className="w-10 h-10 bg-gray-100 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition-colors text-lg">−</button>
                                <div className="text-center">
                                    <input type="number" value={modalState.value}
                                        onChange={e => setModalState(s => ({ ...s, value: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        className="w-20 text-center text-3xl font-bold text-amber-600 border-b-2 border-amber-300 outline-none bg-transparent"
                                        min={1}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">minutes</p>
                                </div>
                                <button onClick={() => setModalState(s => ({ ...s, value: s.value + 5 }))}
                                    className="w-10 h-10 bg-gray-100 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition-colors text-lg">+</button>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button onClick={confirmModal}
                                className={`flex-1 py-2.5 text-white rounded-xl text-sm font-bold transition-colors ${
                                    modalState.type === 'absent' ? 'bg-red-500 hover:bg-red-600' :
                                    modalState.type === 'late'   ? 'bg-amber-500 hover:bg-amber-600' :
                                                                   'bg-blue-500 hover:bg-blue-600'
                                }`}>Confirmer</button>
                            <button onClick={closeModal}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                                Annuler
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

const LoadingState = ({ className }: { className: string }) => (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
        <div className="bg-slate-800 p-4"><div className="h-5 bg-white/20 rounded w-48 animate-pulse" /></div>
        <div className="p-5 space-y-3">
            {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
                </div>
            ))}
        </div>
    </div>
);

const ErrorState = ({ error, refetch, className }: { error: string; refetch: () => void; className: string }) => (
    <div className={`bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden ${className}`} dir="ltr">
        <div className="bg-red-600 p-4">
            <h3 className="text-white font-bold flex items-center gap-2"><AlertOctagon size={18} /> Erreur</h3>
        </div>
        <div className="p-6 text-center">
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button onClick={refetch} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                <RefreshCw size={16} /> Réessayer
            </button>
        </div>
    </div>
);

const EmptyState = ({ nextSession, className }: { nextSession: any; className: string }) => (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`} dir="ltr">
        <div className="bg-slate-800 p-4">
            <h3 className="text-white font-bold flex items-center gap-2"><Clock size={18} className="text-orange-500" /> Session en cours</h3>
        </div>
        <div className="p-8 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock size={24} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700 mb-1">Aucune session en cours</p>
            {nextSession ? (
                <div className="mt-4 bg-orange-50 rounded-xl p-4 border border-orange-100 text-left">
                    <p className="text-xs text-orange-600 font-semibold mb-1">Session suivante</p>
                    <p className="text-sm font-bold text-gray-800">{nextSession.teacher}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{nextSession.subject} — {nextSession.class}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmt(nextSession.time_start)} - {fmt(nextSession.time_end)}</p>
                </div>
            ) : (
                <p className="text-sm text-gray-400">Aucune autre session pour aujourd'hui</p>
            )}
        </div>
    </div>
);

export default CurrentSessionCard;