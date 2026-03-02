import { useState } from 'react';
import { useAttendanceData, type SortField, type SortDir, type AttendanceRecord } from '../hooks/useAttendanceData';
import type { FilterOptions } from '../types';
import {
    ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, Download, RefreshCw,
    CheckCircle, XCircle, AlertTriangle, FileText,
    MoreHorizontal, Clock, X, Check, Printer
} from 'lucide-react';
import * as XLSX from 'xlsx';

/* ═══════════ Props ═══════════ */

interface AttendanceTableProps {
    filters: Partial<FilterOptions>;
    className?: string;
}

/* ═══════════ Status Config ═══════════ */

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
    present: { label: 'حاضر', icon: <CheckCircle size={14} />, classes: 'bg-green-50 text-green-700 border-green-200' },
    absent: { label: 'غائب', icon: <XCircle size={14} />, classes: 'bg-red-50 text-red-700 border-red-200' },
    late: { label: 'متأخر', icon: <Clock size={14} />, classes: 'bg-amber-50 text-amber-700 border-amber-200' },
    excused: { label: 'مبرر', icon: <FileText size={14} />, classes: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const PAGE_SIZES = [10, 25, 50, 100];

/* ═══════════ Component ═══════════ */

const AttendanceTable = ({ filters, className = '' }: AttendanceTableProps) => {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [sortField, setSortField] = useState<SortField>('teacher');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [actionMenu, setActionMenu] = useState<string | null>(null);
    const [showBulkConfirm, setShowBulkConfirm] = useState(false);
    const [bulkAction, setBulkAction] = useState('');
    const [lateInput, setLateInput] = useState<{ id: string; minutes: number } | null>(null);
    const [notesInput, setNotesInput] = useState<{ id: string; text: string } | null>(null);

    const { records, totalCount, loading, error, refetch, updateStatus, bulkUpdateStatus } =
        useAttendanceData({ filters, page, pageSize, sortField, sortDir, statusFilter });

    const totalPages = Math.ceil(totalCount / pageSize);

    // ═══ Sorting ═══
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
        setPage(0);
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronDown size={14} className="text-gray-300" />;
        return sortDir === 'asc'
            ? <ChevronUp size={14} className="text-blue-500" />
            : <ChevronDown size={14} className="text-blue-500" />;
    };

    // ═══ Selection ═══
    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selected.size === records.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(records.map(r => r.schedule_id)));
        }
    };

    // ═══ Actions ═══
    const handleQuickAction = async (scheduleId: string, status: string, notes?: string) => {
        await updateStatus(scheduleId, status, notes);
        setActionMenu(null);
        setLateInput(null);
        setNotesInput(null);
    };

    const handleBulkAction = async () => {
        if (selected.size === 0 || !bulkAction) return;
        await bulkUpdateStatus(Array.from(selected), bulkAction);
        setSelected(new Set());
        setShowBulkConfirm(false);
        setBulkAction('');
    };

    // ═══ Export ═══
    const exportToExcel = () => {
        const data = records.map((r, i) => ({
            '#': i + 1 + page * pageSize,
            'الأستاذ': r.teacher,
            'المادة': r.subject,
            'القسم': r.class,
            'القاعة': r.room,
            'الوقت': `${r.time_start} - ${r.time_end}`,
            'الحالة': r.attendance_status ? STATUS_CONFIG[r.attendance_status]?.label || '—' : '—',
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'الحضور');
        XLSX.writeFile(wb, `سجل_الحضور_${new Date().toLocaleDateString('ar-MR')}.xlsx`);
    };

    const handlePrint = () => window.print();

    // ═══ Render ═══
    return (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-200 gap-3">
                <div className="flex items-center gap-2">
                    <FileText size={18} className="text-green-600" />
                    <h3 className="font-bold text-gray-900 text-sm">سجل الحضور والغياب</h3>
                    <span className="text-xs text-gray-400">({totalCount})</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 outline-none focus:border-blue-300"
                    >
                        <option value="all">كل الحالات</option>
                        <option value="present">✅ حاضر</option>
                        <option value="absent">❌ غائب</option>
                        <option value="late">⏰ متأخر</option>
                        <option value="excused">📝 مبرر</option>
                        <option value="not_recorded">— غير مسجل</option>
                    </select>

                    {/* Bulk actions */}
                    {selected.size > 0 && (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-blue-600 font-medium">{selected.size} محدد</span>
                            <button
                                onClick={() => { setBulkAction('present'); setShowBulkConfirm(true); }}
                                className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                title="تسجيل الكل حاضر"
                            >
                                <CheckCircle size={14} />
                            </button>
                            <button
                                onClick={() => { setBulkAction('absent'); setShowBulkConfirm(true); }}
                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                title="تسجيل الكل غائب"
                            >
                                <XCircle size={14} />
                            </button>
                        </div>
                    )}

                    <button onClick={refetch} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="تحديث">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={exportToExcel} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="تصدير">
                        <Download size={16} />
                    </button>
                    <button onClick={handlePrint} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="طباعة">
                        <Printer size={16} />
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="px-5 py-3 bg-red-50 border-b border-red-100 text-red-600 text-xs flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={refetch} className="text-red-500 hover:text-red-700 font-medium">إعادة المحاولة</button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                    <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-3 py-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={records.length > 0 && selected.size === records.length}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="px-3 py-3 w-10">#</th>
                            <SortableHeader field="teacher" label="الأستاذ" onSort={handleSort} sortIcon={<SortIcon field="teacher" />} />
                            <SortableHeader field="subject" label="المادة" onSort={handleSort} sortIcon={<SortIcon field="subject" />} />
                            <SortableHeader field="class" label="القسم" onSort={handleSort} sortIcon={<SortIcon field="class" />} />
                            <SortableHeader field="room" label="القاعة" onSort={handleSort} sortIcon={<SortIcon field="room" />} />
                            <th className="px-4 py-3">الوقت</th>
                            <SortableHeader field="attendance_status" label="الحالة" onSort={handleSort} sortIcon={<SortIcon field="attendance_status" />} />
                            <th className="px-3 py-3 w-12"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                                <tr key={i} className="border-b border-gray-50 animate-pulse">
                                    {Array.from({ length: 9 }).map((_, j) => (
                                        <td key={j} className="px-4 py-3.5"><div className="h-4 bg-gray-200 rounded w-full" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : records.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-sm">
                                    لا توجد بيانات تطابق الفلاتر المحددة
                                </td>
                            </tr>
                        ) : (
                            records.map((record, idx) => (
                                <TableRow
                                    key={record.id}
                                    record={record}
                                    index={idx + 1 + page * pageSize}
                                    selected={selected.has(record.schedule_id)}
                                    onToggleSelect={() => toggleSelect(record.schedule_id)}
                                    expanded={expandedRow === record.id}
                                    onToggleExpand={() => setExpandedRow(expandedRow === record.id ? null : record.id)}
                                    showActionMenu={actionMenu === record.id}
                                    onToggleActionMenu={() => setActionMenu(actionMenu === record.id ? null : record.id)}
                                    onQuickAction={handleQuickAction}
                                    lateInput={lateInput?.id === record.schedule_id ? lateInput : null}
                                    onSetLateInput={(minutes) => setLateInput({ id: record.schedule_id, minutes })}
                                    onConfirmLate={() => {
                                        if (lateInput) handleQuickAction(lateInput.id, 'late', `تأخر ${lateInput.minutes} دقيقة`);
                                    }}
                                    notesInput={notesInput?.id === record.schedule_id ? notesInput : null}
                                    onSetNotesInput={(text) => setNotesInput({ id: record.schedule_id, text })}
                                    onConfirmNotes={() => {
                                        if (notesInput) handleQuickAction(notesInput.id, 'excused', notesInput.text);
                                    }}
                                    onCancelInput={() => { setLateInput(null); setNotesInput(null); }}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile card view */}
            <div className="sm:hidden divide-y divide-gray-100">
                {!loading && records.map((record, idx) => (
                    <MobileCard
                        key={record.id}
                        record={record}
                        index={idx + 1 + page * pageSize}
                        onQuickAction={handleQuickAction}
                    />
                ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>عرض:</span>
                    {PAGE_SIZES.map(size => (
                        <button
                            key={size}
                            onClick={() => { setPageSize(size); setPage(0); }}
                            className={`px-2 py-1 rounded transition-colors ${pageSize === size
                                ? 'bg-blue-500 text-white font-medium'
                                : 'bg-white border border-gray-200 hover:bg-gray-100'
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setPage(0)} disabled={page === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                        <ChevronsRight size={16} />
                    </button>
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                        <ChevronRight size={16} />
                    </button>
                    <span className="text-xs text-gray-600 font-medium px-2">
                        {page + 1} / {Math.max(1, totalPages)}
                    </span>
                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                        <ChevronsLeft size={16} />
                    </button>
                </div>
            </div>

            {/* Bulk Confirm Modal */}
            {showBulkConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBulkConfirm(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-3">تأكيد العملية الجماعية</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            سيتم تسجيل <strong>{selected.size}</strong> أستاذ كـ
                            <strong> {STATUS_CONFIG[bulkAction]?.label}</strong>.
                            هل أنت متأكد؟
                        </p>
                        <div className="flex gap-2">
                            <button onClick={handleBulkAction} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors">
                                تأكيد
                            </button>
                            <button onClick={() => setShowBulkConfirm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ═══════════ Sub-components ═══════════ */

const SortableHeader = ({ field, label, onSort, sortIcon }: {
    field: SortField; label: string; onSort: (f: SortField) => void; sortIcon: React.ReactNode;
}) => (
    <th
        className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none"
        onClick={() => onSort(field)}
    >
        <div className="flex items-center gap-1">
            <span>{label}</span>
            {sortIcon}
        </div>
    </th>
);

/* ═══════════ Table Row ═══════════ */

interface TableRowProps {
    record: AttendanceRecord;
    index: number;
    selected: boolean;
    onToggleSelect: () => void;
    expanded: boolean;
    onToggleExpand: () => void;
    showActionMenu: boolean;
    onToggleActionMenu: () => void;
    onQuickAction: (id: string, status: string, notes?: string) => void;
    lateInput: { id: string; minutes: number } | null;
    onSetLateInput: (m: number) => void;
    onConfirmLate: () => void;
    notesInput: { id: string; text: string } | null;
    onSetNotesInput: (t: string) => void;
    onConfirmNotes: () => void;
    onCancelInput: () => void;
}

const TableRow = ({
    record, index, selected, onToggleSelect, expanded, onToggleExpand,
    showActionMenu, onToggleActionMenu, onQuickAction,
    lateInput, onSetLateInput, onConfirmLate,
    notesInput, onSetNotesInput, onConfirmNotes, onCancelInput
}: TableRowProps) => {
    const statusCfg = record.attendance_status ? STATUS_CONFIG[record.attendance_status] : null;

    return (
        <>
            <tr className={`border-b border-gray-50 transition-colors ${selected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                <td className="px-3 py-3">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={onToggleSelect}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                </td>
                <td className="px-3 py-3 text-gray-400 text-xs font-mono">{index}</td>
                <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{record.teacher}</td>
                <td className="px-4 py-3 text-gray-600">{record.subject}</td>
                <td className="px-4 py-3 text-gray-600">{record.class}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{record.room || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs font-mono whitespace-nowrap" dir="ltr">
                    {record.time_start} - {record.time_end}
                </td>
                <td className="px-4 py-3">
                    {statusCfg ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${statusCfg.classes}`}>
                            {statusCfg.icon}
                            {statusCfg.label}
                            {record.attendance_status === 'late' && record.late_minutes && (
                                <span className="text-[10px] opacity-70">{record.late_minutes}د</span>
                            )}
                        </span>
                    ) : (
                        <span className="text-gray-300 text-xs">— غير مسجل</span>
                    )}
                </td>
                <td className="px-3 py-3 relative">
                    <button
                        onClick={onToggleActionMenu}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <MoreHorizontal size={16} className="text-gray-400" />
                    </button>

                    {/* Action dropdown */}
                    {showActionMenu && (
                        <div className="absolute left-0 top-full z-40 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                            <button onClick={() => onQuickAction(record.schedule_id, 'present')} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-green-50 text-gray-700 transition-colors">
                                <CheckCircle size={14} className="text-green-500" /> حاضر
                            </button>
                            <button onClick={() => onQuickAction(record.schedule_id, 'absent')} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 text-gray-700 transition-colors">
                                <XCircle size={14} className="text-red-500" /> غائب
                            </button>
                            <button onClick={() => { onSetLateInput(5); onToggleActionMenu(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-amber-50 text-gray-700 transition-colors">
                                <AlertTriangle size={14} className="text-amber-500" /> متأخر
                            </button>
                            <button onClick={() => { onSetNotesInput(''); onToggleActionMenu(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-blue-50 text-gray-700 transition-colors">
                                <FileText size={14} className="text-blue-500" /> مبرر / ملاحظة
                            </button>
                            <hr className="border-gray-100" />
                            <button onClick={onToggleExpand} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-gray-500 transition-colors">
                                <ChevronDown size={14} /> {expanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                            </button>
                        </div>
                    )}
                </td>
            </tr>

            {/* Late input inline */}
            {lateInput && (
                <tr className="bg-amber-50/50 border-b border-amber-100">
                    <td colSpan={9} className="px-6 py-3">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-amber-700 font-medium">دقائق التأخر:</span>
                            <input
                                type="number"
                                value={lateInput.minutes}
                                onChange={(e) => onSetLateInput(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-16 px-2 py-1 border border-amber-200 rounded-lg text-sm text-center outline-none focus:border-amber-400"
                                min={1}
                                autoFocus
                            />
                            <button onClick={onConfirmLate} className="p-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                                <Check size={14} />
                            </button>
                            <button onClick={onCancelInput} className="p-1 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                                <X size={14} />
                            </button>
                        </div>
                    </td>
                </tr>
            )}

            {/* Notes input inline */}
            {notesInput && (
                <tr className="bg-blue-50/50 border-b border-blue-100">
                    <td colSpan={9} className="px-6 py-3">
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={notesInput.text}
                                onChange={(e) => onSetNotesInput(e.target.value)}
                                placeholder="اكتب الملاحظة أو المبرر..."
                                className="flex-1 px-3 py-1.5 border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-400"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && onConfirmNotes()}
                            />
                            <button onClick={onConfirmNotes} className="p-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                <Check size={14} />
                            </button>
                            <button onClick={onCancelInput} className="p-1 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                                <X size={14} />
                            </button>
                        </div>
                    </td>
                </tr>
            )}

            {/* Expanded row */}
            {expanded && (
                <tr className="bg-gray-50/80 border-b border-gray-100">
                    <td colSpan={9} className="px-6 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                                <span className="text-gray-400 block mb-0.5">اليوم</span>
                                <span className="text-gray-800 font-medium">{record.day}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 block mb-0.5">الوقت</span>
                                <span className="text-gray-800 font-medium" dir="ltr">{record.time_start} - {record.time_end}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 block mb-0.5">تاريخ التسجيل</span>
                                <span className="text-gray-800 font-medium">
                                    {record.recorded_at ? new Date(record.recorded_at).toLocaleString('ar-MR') : '—'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400 block mb-0.5">ملاحظات</span>
                                <span className="text-gray-800 font-medium">{record.notes || '—'}</span>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

/* ═══════════ Mobile Card ═══════════ */

const MobileCard = ({ record, index, onQuickAction }: {
    record: AttendanceRecord; index: number; onQuickAction: (id: string, status: string) => void;
}) => {
    const statusCfg = record.attendance_status ? STATUS_CONFIG[record.attendance_status] : null;

    return (
        <div className="p-4 space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-gray-900 text-sm">{index}. {record.teacher}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{record.subject} — {record.class}</p>
                </div>
                {statusCfg ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${statusCfg.classes}`}>
                        {statusCfg.icon} {statusCfg.label}
                    </span>
                ) : (
                    <span className="text-gray-300 text-xs">— غير مسجل</span>
                )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <span>{record.room || '—'}</span>
                <span>•</span>
                <span dir="ltr">{record.time_start} - {record.time_end}</span>
            </div>
            {!record.attendance_status && (
                <div className="flex gap-2">
                    <button onClick={() => onQuickAction(record.schedule_id, 'present')} className="flex-1 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-200">
                        ✅ حاضر
                    </button>
                    <button onClick={() => onQuickAction(record.schedule_id, 'absent')} className="flex-1 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200">
                        ❌ غائب
                    </button>
                </div>
            )}
        </div>
    );
};

export default AttendanceTable;
