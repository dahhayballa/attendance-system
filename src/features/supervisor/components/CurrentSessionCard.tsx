import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentSession } from '../hooks/useCurrentSession';
import { useAuth } from '../../auth/hooks/useAuth';
import { recordAttendance } from '../services/attendanceService';
import { useToast } from '../../../shared/hooks/useToast';
import { Clock, BookOpen, User, MapPin, Building, CheckCircle, AlertTriangle, RefreshCw, AlertOctagon, Search } from 'lucide-react';
import { Modal } from '../../../shared/components/ui/Modal';

interface CurrentSessionCardProps {
    onAttendanceRecorded?: () => void;
    className?: string;
}

const fmt = (t: string) => t?.slice(0, 5) ?? '';

const CurrentSessionCard = ({ onAttendanceRecorded, className = '' }: CurrentSessionCardProps) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { currentSession, nextSession, allCurrentSessions, timeRemaining, progress, loading, error, refetch } = useCurrentSession();
    const { user } = useAuth();
    const { toast } = useToast();

    const [recording, setRecording] = useState<string | null>(null);
    const [modalState, setModalState] = useState<{ type: 'absent' | 'late' | 'notes' | null; scheduleId: string | null; value: any; reason: string }>({ type: null, scheduleId: null, value: '', reason: '' });
    
    const [searchQuery, setSearchQuery] = useState('');
    const [infoSessionId, setInfoSessionId] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000);
        return () => clearInterval(timer);
    }, []);

    const formatDuration = (totalMinutes: number) => {
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        
        if (hours === 0) {
            return `${totalMinutes} ${t('supervisor.currentSessionCard.minutes')}`;
        }
        
        let hrText = "";
        if (isRtl) {
            if (hours === 1) hrText = t('supervisor.currentSessionCard.hour');
            else if (hours === 2) hrText = t('supervisor.currentSessionCard.hour_two', { defaultValue: 'ساعتان' });
            else hrText = `${hours} ${t('supervisor.currentSessionCard.hour')}`;
        } else {
            hrText = `${hours} ${t('supervisor.currentSessionCard.hour')}${hours > 1 ? 's' : ''}`;
        }
            
        if (mins === 0) return hrText;
        return `${hrText} ${t('supervisor.currentSessionCard.and')} ${mins} ${t('supervisor.currentSessionCard.minutes')}`;
    };

    const handleRecord = async (scheduleId: string, status: 'present' | 'absent' | 'late' | 'excused', extraNotes?: string) => {
        if (!user) return;
        try {
            setRecording(scheduleId);
            await recordAttendance(scheduleId, status, user.id, extraNotes);
            toast.success(
                status === 'present' ? t('supervisor.currentSessionCard.toastPresent') :
                status === 'absent'  ? t('supervisor.currentSessionCard.toastAbsent') :
                status === 'late'    ? t('supervisor.currentSessionCard.toastLate') : t('supervisor.currentSessionCard.toastNote')
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

    const closeModal = () => setModalState({ type: null, scheduleId: null, value: '', reason: '' });

    const confirmModal = () => {
        const { type, scheduleId, value, reason } = modalState;
        if (!scheduleId) return;
        if (type === 'absent') handleRecord(scheduleId, 'absent', value || undefined);
        if (type === 'late') {
            const delayText = `${t('supervisor.currentSessionCard.late')} ${formatDuration(value)}`;
            const fullNote = reason.trim() ? `${delayText} - ${reason.trim()}` : delayText;
            handleRecord(scheduleId, 'late', fullNote);
        }
        if (type === 'notes' && value.trim()) handleRecord(scheduleId, 'excused', value);
    };

    if (loading) return <LoadingState className={className} />;
    if (error)   return <ErrorState error={error} refetch={refetch} className={className} />;
    if (!currentSession) return <EmptyState nextSession={nextSession} className={className} />;

    // Filtrage dynamique
    const filteredSessions = (allCurrentSessions || []).filter(s => 
        s.teacher?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const infoSession = allCurrentSessions?.find(s => s.id === infoSessionId);

    return (
        <>
            <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col ${className}`} style={{ maxHeight: 'min(800px, calc(100vh - 120px))' }}>

                {/* ── Header ── */}
                <div className="bg-white-800 px-5 flex-shrink-0 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-black">
                        <Clock size={18} className="animate-pulse text-orange-500" />
                        <span className="font-bold text-base">{t('supervisor.currentSessionCard.title')}</span>
                    </div>
                    {currentSession && (
                        <span className="text-dark text-sm font-mono bg-orange-500/10 px-3 py-1 rounded-lg " dir="ltr">
                            {fmt(currentSession.time_start)} — {fmt(currentSession.time_end)}
                        </span>
                    )}
                </div>

                {/* ── Search Bar ── */}
                <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-white shadow-sm z-10">
                    <div className="relative">
                        <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 text-gray-400`} size={16} />
                        <input
                            type="text"
                            placeholder={t('supervisor.currentSessionCard.searchPlaceholder')}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className={`w-full ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} tracking-wide py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder-gray-400`}
                        />
                    </div>
                </div>

                {/* ── Enregistrements et Professeurs ── */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                        {t('supervisor.currentSessionCard.sessionsList')}
                    </p>
                    {filteredSessions.length > 0 ? filteredSessions.map(session => (
                        <div key={session.id} 
                            className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100 hover:border-orange-300 transition-colors shadow-sm cursor-pointer group"
                            onClick={() => setInfoSessionId(session.id)}
                        >
                            <div className="min-w-0 pr-3 flex-1">
                                <p className="text-sm font-bold text-gray-800 truncate group-hover:text-orange-700 transition-colors">{session.teacher}</p>
                                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{session.subject} — <span className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">{session.class}</span></p>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0 relative z-10" onClick={e => e.stopPropagation()}>
{(() => {
    const isAutoAbsent = session.status === 'absent' && !session.recorded_by;
    const isRecordedByHuman = 
        !!session.status && 
        session.status !== 'pending' && 
        !isAutoAbsent;

    // ── Heure locale école (Nouakchott) ──
    const nowLocal = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit', minute: '2-digit', hour12: false,
        timeZone: 'Africa/Nouakchott',
    }).format(currentTime);
    const [nowH, nowM] = nowLocal.split(':').map(Number);
    const currentMins = nowH * 60 + nowM;

    const [sh, sm] = (session.time_start || '00:00').split(':').map(Number);
    const [] = (session.time_end   || '00:00').split(':').map(Number);
    const startMins = sh * 60 + sm;

    // 20 min après le début = seuil retard
    const lateThreshold = startMins + 20;
    const isAfterLateThreshold = currentMins >= lateThreshold;

    // ── Si déjà enregistré par humain → afficher le statut + bouton Modifier ──
    if (isRecordedByHuman) {
        const isPresent = session.status === 'present';
        const isLateRec = session.status === 'late';

        return (
            <div className="flex items-center gap-1.5">
                {/* Badge statut actuel */}
                <span className={`px-2.5 py-1 rounded-lg border font-semibold text-xs flex items-center gap-1
                    ${isPresent ? 'bg-green-50 text-green-600 border-green-200'
                    : isLateRec ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {isPresent  ? <CheckCircle size={13} /> 
                    : isLateRec ? <AlertTriangle size={13} /> 
                                : <AlertOctagon size={13} />}
                    {isPresent  ? t('supervisor.currentSessionCard.present', 'Présent')
                    : isLateRec ? t('supervisor.currentSessionCard.late', 'En retard')
                                : t('supervisor.currentSessionCard.absent', 'Absent')}
                </span>

                {/* Bouton Modifier — toujours visible pendant la session */}
                <button
                    onClick={() => {
                        // Proposer l'inverse du statut actuel
                        const nextStatus = isPresent ? 'late' : 'present';
                        if (nextStatus === 'late') {
                            const diff = Math.max(1, currentMins - lateThreshold);
                            setModalState({ type: 'late', scheduleId: session.id, value: diff, reason: '' });
                        } else {
                            handleRecord(session.id, 'present');
                        }
                    }}
                    disabled={recording === session.id}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold text-xs transition-all shadow-sm
                        bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200
                        ${recording === session.id ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
                >
                    <RefreshCw size={13} />
                    <span>{t('supervisor.currentSessionCard.edit', 'Modifier')}</span>
                </button>
            </div>
        );
    }

    // ── Pas encore enregistré → deux boutons selon l'heure ──
    const isDisabled = recording === session.id;

    return (
        <div className="flex items-center gap-1.5">

            {/* Bouton principal : Présent (avant 20 min) ou En retard (après 20 min) */}
            <button
                onClick={() => {
                    if (isAfterLateThreshold) {
                        const diff = Math.max(1, currentMins - lateThreshold);
                        setModalState({ type: 'late', scheduleId: session.id, value: diff, reason: '' });
                    } else {
                        handleRecord(session.id, 'present');
                    }
                }}
                disabled={isDisabled}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border font-semibold text-sm shadow-sm
                    ${isAfterLateThreshold
                        ? 'bg-orange-50 text-orange-500 hover:bg-orange-100 border-orange-200'
                        : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200'}
                    ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
            >
                {isAfterLateThreshold
                    ? <><Clock size={15} className="animate-pulse" /><span>{t('supervisor.currentSessionCard.late', 'En retard')}</span></>
                    : <><CheckCircle size={15} className="animate-pulse" /><span>{t('supervisor.currentSessionCard.present', 'Présent')}</span></>
                }
            </button>

            {/* Bouton Absent — toujours visible */}
            <button
                onClick={() => setModalState({ type: 'absent', scheduleId: session.id, value: '', reason: '' })}
                disabled={isDisabled}
                className={`flex items-center justify-center px-2.5 py-1.5 rounded-lg border transition-all font-semibold text-sm shadow-sm
                    bg-red-50 text-red-500 hover:bg-red-100 border-red-200
                    ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
                title={t('supervisor.currentSessionCard.absent', 'Absent')}
            >
                <AlertOctagon size={15} />
            </button>

        </div>
    );
})()}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100 border-dashed">
                            <Search size={24} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">{t('supervisor.currentSessionCard.noResults')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Info Modal (Détails de la Session) ── */}
            {infoSession && (
                <Modal title={t('supervisor.currentSessionCard.detailsTitle')} onClose={() => setInfoSessionId(null)}>
                    <div className={isRtl ? 'font-arabic' : ''} dir={isRtl ? 'rtl' : 'ltr'}>
                        <div className="bg-gray-50 flex flex-col rounded-xl border border-gray-100 mb-5 overflow-hidden">
                            {[
                                { icon: <Building size={16} />,  label: t('supervisor.currentSessionCard.classLabel'),   value: infoSession.class },
                                { icon: <BookOpen size={16} />,  label: t('supervisor.currentSessionCard.subjectLabel'),  value: infoSession.subject },
                                { icon: <User size={16} />,      label: t('supervisor.currentSessionCard.teacherLabel'), value: infoSession.teacher, bold: true },
                                { icon: <MapPin size={16} />,    label: t('supervisor.currentSessionCard.roomLabel'),  value: infoSession.room || '—' },
                                { icon: <Clock size={16} />,     label: t('supervisor.currentSessionCard.timeRemaining'),
                                    value: <span dir="ltr" className="inline-block">{timeRemaining} {t('supervisor.currentSessionCard.minutes')}</span>,
                                    color: timeRemaining <= 10 ? 'text-red-600' : timeRemaining <= 20 ? 'text-amber-600' : 'text-green-600'
                                },
                                {
                                    icon: <CheckCircle size={16} />,
                                    label: t('supervisor.currentSessionCard.statusLabel'),
                                    value: (() => {
                                        const isAutoAbsent = infoSession.status === 'absent' && !infoSession.recorded_by;
                                        const isRec = infoSession.status && infoSession.status !== 'pending' && !isAutoAbsent;
                                        
                                        if (isRec) {
                                            const formatOpts: Intl.DateTimeFormatOptions = { 
                                                hour: '2-digit', 
                                                minute: '2-digit',
                                                numberingSystem: 'latn' 
                                            };
                                            const timeStr = infoSession.recorded_at 
                                                ? new Date(infoSession.recorded_at).toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'fr-FR', formatOpts) 
                                                : new Date().toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'fr-FR', formatOpts);
                                                
                                            if (infoSession.status === 'present') return <span dir="ltr">{t('supervisor.currentSessionCard.presentAt')} {timeStr}</span>;
                                            if (infoSession.status === 'late') return <span dir="ltr">{t('supervisor.currentSessionCard.lateAt')} {timeStr}</span>;
                                            if (infoSession.status === 'absent') return t('supervisor.currentSessionCard.absentRecorded');
                                            return `${t('supervisor.currentSessionCard.statusLabel')} : ${infoSession.status}`;
                                        }
                                        const cm = currentTime.getHours() * 60 + currentTime.getMinutes();
                                        const [h, m] = (infoSession.time_start || '00:00').split(':').map(Number);
                                        const isL = cm > (h * 60 + m) + 20;
                                        return isL ? t('supervisor.currentSessionCard.pending', 'En attente') : t('supervisor.currentSessionCard.willBePresent', 'Sera présent');
                                    })(),
                                    color: (infoSession.status && infoSession.status !== 'pending' && (!infoSession.status || infoSession.recorded_by)) ? 'text-blue-600' : 'text-gray-500'
                                },
                            ].map(({ icon, label, value, bold, color }, i) => (
                                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-white transition-colors">
                                    <div className="flex items-center gap-2.5 text-gray-500">
                                        <div className="text-orange-500">{icon}</div>
                                        <span className="text-xs font-semibold uppercase tracking-wider ">{label}</span>
                                    </div>
                                    <span className={`text-sm tracking-wide ${bold ? 'font-black text-gray-900' : 'font-semibold text-gray-700'} ${color ?? ''}`}>
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* ── Progress bar ── */}
                        <div className="mb-2 px-1">
                            <div className={`flex justify-between text-xs text-gray-400 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <span className="font-mono font-semibold" dir="ltr">{fmt(infoSession.time_start)}</span>
                                <span className="font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full" dir="ltr">{progress}%</span>
                                <span className="font-mono font-semibold" dir="ltr">{fmt(infoSession.time_end)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200/50">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 shadow-sm transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                        {/* boutton d'Actions facultatifs */}


                    </div>
                </Modal>
            )}

            {/* ── Action Modal ── */}
            {modalState.type && (
                <Modal
                    title={modalState.type === 'absent' ? t('supervisor.currentSessionCard.recordAbsentTitle') : modalState.type === 'late' ? t('supervisor.currentSessionCard.recordLateTitle') : t('supervisor.currentSessionCard.addNoteTitle')}
                    onClose={closeModal}
                >
                    <div className={`space-y-4 ${isRtl ? 'font-arabic' : ''}`}>
                        {modalState.type === 'absent' && (
                            <textarea
                                value={modalState.value}
                                onChange={e => setModalState(s => ({ ...s, value: e.target.value }))}
                                placeholder={t('supervisor.currentSessionCard.absentPlaceholder')}
                                className={`w-full p-3 border border-gray-200 rounded-xl text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-red-200 placeholder-gray-400 ${isRtl ? 'text-right' : ''}`}
                                rows={3}
                            />
                        )}
                        {modalState.type === 'notes' && (
                            <textarea
                                value={modalState.value}
                                onChange={e => setModalState(s => ({ ...s, value: e.target.value }))}
                                placeholder={t('supervisor.currentSessionCard.notePlaceholder')}
                                className={`w-full p-3 border border-gray-200 rounded-xl text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-blue-200 placeholder-gray-400 ${isRtl ? 'text-right' : ''}`}
                                rows={4} autoFocus
                            />
                        )}
                        {modalState.type === 'late' && (
                            <div className="space-y-4">
                                <div className={`flex items-center justify-center gap-4 py-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <button onClick={() => setModalState(s => ({ ...s, value: Math.max(1, s.value - 5) }))}
                                        className="w-12 h-12 bg-gray-100 rounded-2xl text-gray-600 font-bold hover:bg-gray-200 transition-colors text-xl shadow-sm">−</button>
                                    <div className="text-center w-24">
                                        <input type="number" value={modalState.value}
                                            onChange={e => setModalState(s => ({ ...s, value: Math.max(1, parseInt(e.target.value) || 1) }))}
                                            className="w-full text-center text-4xl font-black text-amber-600 border-b-2 border-amber-300 outline-none bg-transparent pb-1"
                                            min={1}
                                        />
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2">{formatDuration(modalState.value)}</p>
                                    </div>
                                    <button onClick={() => setModalState(s => ({ ...s, value: s.value + 5 }))}
                                        className="w-12 h-12 bg-gray-100 rounded-2xl text-gray-600 font-bold hover:bg-gray-200 transition-colors text-xl shadow-sm">+</button>
                                </div>
                                <textarea
                                    value={modalState.reason}
                                    onChange={e => setModalState(s => ({ ...s, reason: e.target.value }))}
                                    placeholder={t('supervisor.currentSessionCard.lateReasonPlaceholder', 'Motif du retard (optionnel)')}
                                    className={`w-full p-3 border border-gray-200 rounded-xl text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-amber-200 placeholder-gray-400 ${isRtl ? 'text-right' : ''}`}
                                    rows={2}
                                />
                            </div>
                        )}
                        <div className={`flex gap-3 pt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <button onClick={confirmModal}
                                className={`flex-1 py-3 text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 ${
                                    modalState.type === 'absent' ? 'bg-red-500 hover:bg-red-600' :
                                    modalState.type === 'late'   ? 'bg-amber-500 hover:bg-amber-600' :
                                                                   'bg-blue-500 hover:bg-blue-600'
                                }`}>{t('supervisor.currentSessionCard.confirm')}</button>
                            <button onClick={closeModal}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all active:scale-95">
                                {t('supervisor.currentSessionCard.cancel')}
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
        <div className="bg-slate-800 p-4"><div className="h-5 bg-white/20 rounded-lg w-48 animate-pulse" /></div>
        <div className="p-5 space-y-4">
            {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-gray-100 rounded-full w-1/3 animate-pulse" />
                        <div className="h-2.5 bg-gray-50 rounded-full w-1/4 animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const ErrorState = ({ error, refetch, className }: { error: string; refetch: () => void; className: string }) => {
    const { t } = useTranslation();
    return (
    <div className={`bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden ${className}`}>
        <div className="bg-red-600 p-4">
            <h3 className="text-white font-bold flex items-center gap-2"><AlertOctagon size={18} /> {t('supervisor.currentSessionCard.errorTitle')}</h3>
        </div>
        <div className="p-8 text-center bg-red-50/30">
            <p className="text-gray-600 text-sm font-medium mb-5">{error}</p>
            <button onClick={refetch} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 shadow-sm text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all active:scale-95">
                <RefreshCw size={16} /> {t('supervisor.currentSessionCard.retry')}
            </button>
        </div>
    </div>
    );
};

const EmptyState = ({ nextSession, className }: { nextSession: any; className: string }) => {
    const { t } = useTranslation();
    return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col items-center justify-center p-10 ${className}`}>
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-inner">
            <Clock size={28} className="text-gray-300" />
        </div>
        <p className="font-bold text-gray-800 mb-1 text-lg">{t('supervisor.currentSessionCard.noCurrentSession')}</p>
        
        {nextSession ? (
            <div className="mt-6 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-5 border border-orange-100 w-full max-w-sm text-center shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-orange-600 font-bold mb-3">{t('supervisor.currentSessionCard.nextSessionTitle')}</p>
                <p className="text-base font-black text-gray-900 leading-tight">{nextSession.teacher}</p>
                <p className="text-sm font-semibold text-gray-600 mt-1">{nextSession.subject} <span className="text-gray-400 font-normal mx-1">—</span> {nextSession.class}</p>
                <div className="mt-3 inline-block bg-white px-3 py-1.5 rounded-lg border border-orange-100 shadow-sm">
                    <p className="text-xs font-mono font-bold text-orange-600" dir="ltr">{fmt(nextSession.time_start)} - {fmt(nextSession.time_end)}</p>
                </div>
            </div>
        ) : (
            <p className="text-sm font-medium text-gray-400 mt-2">{t('supervisor.currentSessionCard.noOtherSessions')}</p>
        )}
    </div>
    );
};

export default CurrentSessionCard;