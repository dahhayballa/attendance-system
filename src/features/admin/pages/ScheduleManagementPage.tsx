import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../../shared/components/layout/Layout';
import { useToast } from '../../../shared/hooks/useToast';
import { useAuth } from '../../auth/hooks/useAuth';
import { adminService } from '../../../services/supabase/admin.service';
import {
    getSchedulesByWeek,
    cancelSchedule,
    restoreSchedule,
    bulkCancelSchedules,
    updateScheduleDetails,
    getCancelledSchedules,
} from '../../../services/supabase/schedule.service';
import { Schedule, SuspensionFilters } from '../../../types';
import {
    Ban, RotateCcw, Edit2, AlertTriangle,
    CheckCircle, ChevronDown, Loader2, X, Save,
    Filter, Calendar, Info,
} from 'lucide-react';
import { Modal } from '../../../shared/components/ui/Modal';

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAYS_AR = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

// ─── Edit Modal ───────────────────────────────────────────────────────────────
const EditModal = ({
    session, onClose, onSave, t,
}: {
    session: Schedule;
    onClose: () => void;
    onSave: (id: string, u: Partial<Schedule>) => Promise<void>;
    t: (k: string) => string;
}) => {
    const [form, setForm] = useState({
        teacher: session.teacher,
        subject: session.subject,
        room: session.room || '',
        time_start: session.time_start,
        time_end: session.time_end,
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave(session.id, form);
        setSaving(false);
        onClose();
    };

    const fields: { label: string; key: keyof typeof form; type?: string }[] = [
        { label: t('admin.scheduleManagement.editTeacher'), key: 'teacher' },
        { label: t('admin.scheduleManagement.editSubject'), key: 'subject' },
        { label: t('admin.scheduleManagement.editRoom'), key: 'room' },
        { label: t('admin.scheduleManagement.editStart'), key: 'time_start', type: 'time' },
        { label: t('admin.scheduleManagement.editEnd'), key: 'time_end', type: 'time' },
    ];

    return (
        <Modal title={t('admin.scheduleManagement.editModalTitle')} onClose={onClose}>
            <div className="space-y-3">
                {fields.map(({ label, key, type }) => (
                    <div key={key}>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                        <input
                            type={type || 'text'}
                            value={(form as any)[key]}
                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                        />
                    </div>
                ))}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {t('admin.scheduleManagement.saveBtnLabel')}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        {t('admin.scheduleManagement.confirmCancel')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// ─── Cancel / Confirm Modal ───────────────────────────────────────────────────
const ReasonModal = ({
    title, onClose, onConfirm, t,
}: {
    title: string;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    t: (k: string) => string;
}) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!reason.trim()) return;
        setLoading(true);
        await onConfirm(reason);
        setLoading(false);
        onClose();
    };

    return (
        <Modal title={title} onClose={onClose}>
            <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p
                        className="text-xs text-amber-700"
                        dangerouslySetInnerHTML={{ __html: t('admin.scheduleManagement.warnPending') }}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        {t('admin.scheduleManagement.step3')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder={t('admin.scheduleManagement.reasonPlaceholder')}
                        rows={3}
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleConfirm}
                        disabled={!reason.trim() || loading}
                        className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                        {t('admin.scheduleManagement.confirmOk')}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        {t('admin.scheduleManagement.confirmCancel')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
    const cfg: Record<string, string> = {
        pending: 'bg-gray-100 text-gray-600',
        present: 'bg-green-100 text-green-700',
        late: 'bg-amber-100 text-amber-700',
        absent: 'bg-red-100 text-red-700',
        cancelled: 'bg-rose-100 text-rose-700',
    };
    const labels: Record<string, string> = {
        pending: 'En attente', present: 'Présent', late: 'Retard',
        absent: 'Absent', cancelled: 'Annulée',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${cfg[status] || cfg.pending}`}>
            {status === 'cancelled' && <Ban size={10} />}
            {status === 'present' && <CheckCircle size={10} />}
            {labels[status] || status}
        </span>
    );
};

// ─── Step Number ──────────────────────────────────────────────────────────────
const StepNum = ({ n, active }: { n: number; active: boolean }) => (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors
        ${active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
        {n}
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const ScheduleManagementPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { toast } = useToast();
    const { user } = useAuth();

    const DAYS = isRtl ? DAYS_AR : DAYS_FR;

    const [weeks, setWeeks] = useState<any[]>([]);
    const [selectedWeek, setSelectedWeek] = useState('');
    const [filterDay, setFilterDay] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [classes, setClasses] = useState<string[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [cancelled, setCancelled] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<'bulk' | 'list' | 'cancelled'>('bulk');

    // Modals
    const [editTarget, setEditTarget] = useState<Schedule | null>(null);
    const [cancelTarget, setCancelTarget] = useState<Schedule | null>(null);
    const [showBulkModal, setShowBulkModal] = useState(false);

    // Bulk form
    const [bulkDay, setBulkDay] = useState('');
    const [bulkClass, setBulkClass] = useState('');

    useEffect(() => {
        adminService.getWeeksWithCounts()
            .then(w => { setWeeks(w); if (w.length) setSelectedWeek(w[0].id); })
            .catch(() => toast.error(t('admin.scheduleManagement.errorLoad')));
        adminService.getFiltersOptions()
            .then(opts => setClasses(opts.classes))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!selectedWeek) return;
        loadSchedules();
        loadCancelled();
    }, [selectedWeek]);

    const loadSchedules = async () => {
        setLoading(true);
        try { setSchedules(await getSchedulesByWeek(selectedWeek)); }
        catch { toast.error(t('admin.scheduleManagement.errorLoad')); }
        finally { setLoading(false); }
    };

    const loadCancelled = async () => {
        try { setCancelled(await getCancelledSchedules(selectedWeek)); }
        catch {}
    };

    const filtered = schedules.filter(s => {
        if (s.status === 'cancelled') return false;
        if (filterDay && s.day !== filterDay) return false;
        if (filterClass && s.class !== filterClass) return false;
        return true;
    });

    const handleCancel = async (reason: string) => {
        if (!cancelTarget || !user) return;
        try {
            await cancelSchedule(cancelTarget.id, reason, user.id);
            toast.success(t('admin.scheduleManagement.successCancel'));
            loadSchedules(); loadCancelled();
        } catch { toast.error(t('admin.scheduleManagement.errorAction')); }
    };

    const handleEdit = async (id: string, updates: any) => {
        try {
            await updateScheduleDetails(id, updates);
            toast.success(t('admin.scheduleManagement.successEdit'));
            loadSchedules();
        } catch { toast.error(t('admin.scheduleManagement.errorAction')); }
    };

    const handleRestore = async (id: string) => {
        try {
            await restoreSchedule(id);
            toast.success(t('admin.scheduleManagement.successRestore'));
            loadSchedules(); loadCancelled();
        } catch { toast.error(t('admin.scheduleManagement.errorAction')); }
    };

    const handleBulkCancel = async (reason: string) => {
        if (!user || !selectedWeek) return;
        const filters: SuspensionFilters = {
            week_id: selectedWeek,
            reason,
            day: bulkDay || undefined,
            class: bulkClass || undefined,
        };
        try {
            const { count } = await bulkCancelSchedules(filters, user.id);
            toast.success(t('admin.scheduleManagement.successSuspend').replace('{{count}}', String(count)));
            loadSchedules(); loadCancelled();
        } catch { toast.error(t('admin.scheduleManagement.errorAction')); }
    };

    const scopeText = () => {
        const d = bulkDay || t('admin.scheduleManagement.allDays');
        const c = bulkClass || t('admin.scheduleManagement.allClasses');
        return `${d} · ${c}`;
    };

    const tabs = [
        { key: 'bulk' as const, label: t('admin.scheduleManagement.tabSuspend'), icon: <Ban size={14} /> },
        { key: 'list' as const, label: t('admin.scheduleManagement.tabList'), icon: <Calendar size={14} /> },
        { key: 'cancelled' as const, label: t('admin.scheduleManagement.tabCancelled'), icon: <X size={14} />, count: cancelled.length },
    ];

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-4 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">
                            {t('admin.scheduleManagement.pageTitle')}
                        </h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {t('admin.scheduleManagement.pageSubtitle')}
                        </p>
                    </div>
                    {/* Week selector */}
                    <div className="relative">
                        <select
                            value={selectedWeek}
                            onChange={e => setSelectedWeek(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer"
                        >
                            {weeks.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex border-b border-gray-200">
                    {tabs.map(tab_ => (
                        <button
                            key={tab_.key}
                            onClick={() => setTab(tab_.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors -mb-px
                                ${tab === tab_.key
                                    ? 'border-gray-900 text-gray-900 font-medium'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab_.icon}
                            {tab_.label}
                            {tab_.count != null && tab_.count > 0 && (
                                <span className="bg-red-100 text-red-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                                    {tab_.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ══════════════════════ TAB: BULK ══════════════════════ */}
                {tab === 'bulk' && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                        {/* Step 1 — Week (already selected in header, show recap) */}
                        <div className="flex items-start gap-3 p-5 border-b border-gray-100">
                            <StepNum n={1} active={true} />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 mb-3">
                                    {t('admin.scheduleManagement.step1')}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {weeks.map(w => (
                                        <button
                                            key={w.id}
                                            onClick={() => setSelectedWeek(w.id)}
                                            className={`px-3 py-1.5 rounded-lg border text-sm transition-colors
                                                ${selectedWeek === w.id
                                                    ? 'bg-gray-900 text-white border-gray-900'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                                        >
                                            {w.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Step 2 — Scope */}
                        <div className="flex items-start gap-3 p-5 border-b border-gray-100">
                            <StepNum n={2} active={!!selectedWeek} />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                    {t('admin.scheduleManagement.step2')}
                                </p>
                                <p className="text-xs text-gray-400 mb-3">
                                    {t('admin.scheduleManagement.step2Sub')}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                            {t('admin.scheduleManagement.dayLabel')}
                                        </label>
                                        <select
                                            value={bulkDay}
                                            onChange={e => setBulkDay(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        >
                                            <option value="">{t('admin.scheduleManagement.allDays')}</option>
                                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                            {t('admin.scheduleManagement.classLabel')}
                                        </label>
                                        <select
                                            value={bulkClass}
                                            onChange={e => setBulkClass(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        >
                                            <option value="">{t('admin.scheduleManagement.allClasses')}</option>
                                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {/* Scope recap */}
                                <div className="flex items-center gap-2 mt-3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                                    <Info size={14} className="text-gray-400 flex-shrink-0" />
                                    <span className="font-medium">{scopeText()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 — Reason + Confirm */}
                        <div className="flex items-start gap-3 p-5">
                            <StepNum n={3} active={!!selectedWeek} />
                            <div className="flex-1 space-y-3">
                                <p className="text-sm font-medium text-gray-900">
                                    {t('admin.scheduleManagement.step3')}
                                </p>

                                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                    <p
                                        className="text-xs text-amber-700 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: t('admin.scheduleManagement.warnPending') }}
                                    />
                                </div>

                                <button
                                    onClick={() => setShowBulkModal(true)}
                                    disabled={!selectedWeek}
                                    className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-700 disabled:opacity-40 transition-colors"
                                >
                                    <Ban size={15} />
                                    {t('admin.scheduleManagement.suspendBtn')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════ TAB: LIST ══════════════════════ */}
                {tab === 'list' && (
                    <div className="space-y-3">
                        {/* Filters */}
                        <div className="flex flex-wrap gap-2 items-center bg-white border border-gray-200 rounded-xl p-3">
                            <Filter size={13} className="text-gray-400" />
                            <select
                                value={filterDay}
                                onChange={e => setFilterDay(e.target.value)}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none"
                            >
                                <option value="">{t('admin.scheduleManagement.allDays')}</option>
                                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select
                                value={filterClass}
                                onChange={e => setFilterClass(e.target.value)}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none"
                            >
                                <option value="">{t('admin.scheduleManagement.allClasses')}</option>
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {(filterDay || filterClass) && (
                                <button
                                    onClick={() => { setFilterDay(''); setFilterClass(''); }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-500 hover:bg-gray-200 transition-colors"
                                >
                                    <X size={11} /> Reset
                                </button>
                            )}
                            <span className="ml-auto text-xs text-gray-400">{filtered.length} séance(s)</span>
                        </div>

                        {/* Table */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 size={24} className="animate-spin text-gray-300" />
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <Calendar size={28} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Aucune séance trouvée</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50">
                                                {['Jour', 'Horaire', 'Enseignant', 'Matière', 'Classe', 'Salle', 'Statut', 'Actions'].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map(s => (
                                                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 text-xs text-gray-600">{s.day}</td>
                                                    <td className="px-4 py-3 font-mono text-xs text-gray-500" dir="ltr">
                                                        {s.time_start?.slice(0, 5)} – {s.time_end?.slice(0, 5)}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-medium text-gray-900 max-w-[130px] truncate">{s.teacher}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-600">{s.subject}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium">
                                                            {s.class}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-400">{s.room || '—'}</td>
                                                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => setEditTarget(s)}
                                                                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                                                                title={t('admin.scheduleManagement.editBtn')}
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                            {s.status === 'pending' && (
                                                                <button
                                                                    onClick={() => setCancelTarget(s)}
                                                                    className="p-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                                    title={t('admin.scheduleManagement.cancelBtn')}
                                                                >
                                                                    <Ban size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════════════════ TAB: CANCELLED ══════════════════════ */}
                {tab === 'cancelled' && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        {cancelled.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <CheckCircle size={28} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">{t('admin.scheduleManagement.noCancelled')}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50">
                                            {['Jour', 'Horaire', 'Enseignant', 'Classe', 'Motif', 'Actions'].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cancelled.map(s => (
                                            <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-xs text-gray-600">{s.day}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-gray-500" dir="ltr">
                                                    {s.time_start?.slice(0, 5)} – {s.time_end?.slice(0, 5)}
                                                </td>
                                                <td className="px-4 py-3 text-xs font-medium text-gray-900">{s.teacher}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium">
                                                        {s.class}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-400 max-w-[160px] truncate" title={s.cancellation_reason || ''}>
                                                    {s.cancellation_reason || '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => handleRestore(s.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:border-gray-400 transition-colors"
                                                    >
                                                        <RotateCcw size={11} />
                                                        {t('admin.scheduleManagement.restoreBtn')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            {editTarget && (
                <EditModal
                    session={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSave={handleEdit}
                    t={t}
                />
            )}
            {cancelTarget && (
                <ReasonModal
                    title={`${t('admin.scheduleManagement.cancelBtn')} : ${cancelTarget.teacher} — ${cancelTarget.class}`}
                    onClose={() => setCancelTarget(null)}
                    onConfirm={handleCancel}
                    t={t}
                />
            )}
            {showBulkModal && (
                <ReasonModal
                    title={t('admin.scheduleManagement.confirmTitle')}
                    onClose={() => setShowBulkModal(false)}
                    onConfirm={handleBulkCancel}
                    t={t}
                />
            )}
        </Layout>
    );
};

export default ScheduleManagementPage;