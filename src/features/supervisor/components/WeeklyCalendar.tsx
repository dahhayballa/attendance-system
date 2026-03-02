import { useState } from 'react';
import { useWeeklyData, useCalendarNavigation, type CalendarCell } from '../hooks/useWeeklyData';
import { useAuth } from '../../auth/hooks/useAuth';
import { recordAttendance } from '../services/attendanceService';
import { useToast } from '../../../shared/hooks/useToast';
import {
    Calendar, ChevronRight, ChevronLeft,
    CheckCircle, XCircle, Clock, FileText, X, RefreshCw
} from 'lucide-react';

/* ═══════════ Status Config ═══════════ */

const STATUS = {
    present: { icon: '✅', label: 'حاضر', bg: 'bg-green-50 border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
    absent: { icon: '❌', label: 'غائب', bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
    late: { icon: '⏰', label: 'متأخر', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
    excused: { icon: '📝', label: 'مبرر', bg: 'bg-gray-100 border-gray-300', text: 'text-gray-600', dot: 'bg-gray-400' },
};

/* ═══════════ Component ═══════════ */

interface WeeklyCalendarProps {
    className?: string;
}

const WeeklyCalendar = ({ className = '' }: WeeklyCalendarProps) => {
    const nav = useCalendarNavigation();
    const { cells, days, timeSlots, loading, error, refetch } = useWeeklyData(nav.weekOffset);
    const { user } = useAuth();
    const { toast } = useToast();

    const [selectedCell, setSelectedCell] = useState<CalendarCell | null>(null);
    const [hoveredCell, setHoveredCell] = useState<string | null>(null);
    const [recording, setRecording] = useState(false);

    // Get cell for a specific day + slot
    const getCell = (day: string, slot: string): CalendarCell | undefined =>
        cells.find(c => c.day === day && c.timeSlot === slot);

    // Today's day name for highlighting
    const todayName = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][new Date().getDay()];

    // Record attendance from cell detail
    const handleRecord = async (scheduleId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
        if (!user) return;
        try {
            setRecording(true);
            await recordAttendance(scheduleId, status, user.id);
            toast.success(status === 'present' ? 'تم تسجيل الحضور ✅' : `تم تسجيل: ${STATUS[status].label}`);
            setSelectedCell(null);
            refetch();
        } catch (err: any) {
            toast.error(err.message || 'فشل في التسجيل');
        } finally {
            setRecording(false);
        }
    };

    // Format time slot for display (e.g., "08:00-09:00" → "08-09")
    const shortSlot = (slot: string) => {
        const [start] = slot.split('-');
        return `${start?.slice(0, 5)}`;
    };

    return (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
            {/* ═══ Header ═══ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-200 gap-2">
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-500" />
                    <h3 className="font-bold text-gray-900 text-sm">التقويم الأسبوعي</h3>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={nav.goToPreviousWeek}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        title="أسبوع سابق"
                    >
                        <ChevronRight size={16} className="text-gray-500" />
                    </button>
                    <button
                        onClick={nav.goToCurrentWeek}
                        disabled={nav.isCurrentWeek}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${nav.isCurrentWeek
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {nav.isCurrentWeek ? 'الأسبوع الحالي' : 'العودة لليوم'}
                    </button>
                    <button
                        onClick={nav.goToNextWeek}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        title="أسبوع تالي"
                    >
                        <ChevronLeft size={16} className="text-gray-500" />
                    </button>
                    <span className="text-[11px] text-gray-500 mr-2 hidden sm:inline">
                        {nav.weekDates.label}
                    </span>
                </div>
            </div>

            {/* ═══ Error ═══ */}
            {error && (
                <div className="px-5 py-3 bg-red-50 border-b border-red-100 text-red-600 text-xs flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={refetch} className="font-medium hover:text-red-700">إعادة المحاولة</button>
                </div>
            )}

            {/* ═══ Loading ═══ */}
            {loading ? (
                <div className="p-6">
                    <div className="grid grid-cols-6 gap-2">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
            ) : days.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">
                    لا توجد بيانات لهذا الأسبوع
                </div>
            ) : (
                <>
                    {/* ═══ Desktop Table ═══ */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            {/* Time slot headers */}
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-3 py-2 text-right text-[11px] text-gray-500 font-medium border-b border-l border-gray-200 w-24 sticky right-0 bg-gray-50 z-10">
                                        اليوم
                                    </th>
                                    {timeSlots.map(slot => (
                                        <th key={slot} className="px-2 py-2 text-center text-[10px] text-gray-500 font-medium border-b border-l border-gray-200 min-w-[120px]" dir="ltr">
                                            {shortSlot(slot)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {days.map(day => (
                                    <tr key={day} className={day === todayName && nav.isCurrentWeek ? 'bg-indigo-50/30' : ''}>
                                        {/* Day label */}
                                        <td className={`px-3 py-2 text-xs font-bold border-b border-l border-gray-200 sticky right-0 z-10 ${day === todayName && nav.isCurrentWeek
                                            ? 'bg-indigo-100 text-indigo-800'
                                            : 'bg-gray-50 text-gray-700'
                                            }`}>
                                            {day}
                                            {day === todayName && nav.isCurrentWeek && (
                                                <span className="block text-[9px] text-indigo-500 font-normal">اليوم</span>
                                            )}
                                        </td>
                                        {/* Cells */}
                                        {timeSlots.map(slot => {
                                            const cell = getCell(day, slot);
                                            const cellId = `${day}-${slot}`;
                                            return (
                                                <td
                                                    key={slot}
                                                    className="border-b border-l border-gray-200 p-0.5 relative"
                                                    onMouseEnter={() => setHoveredCell(cellId)}
                                                    onMouseLeave={() => setHoveredCell(null)}
                                                >
                                                    {cell?.schedule ? (
                                                        <button
                                                            onClick={() => setSelectedCell(cell)}
                                                            className={`w-full h-full min-h-[72px] rounded-lg p-2 text-right transition-all hover:shadow-md cursor-pointer border ${cell.attendance?.status
                                                                ? STATUS[cell.attendance.status].bg
                                                                : 'bg-white border-gray-100 hover:border-gray-300'
                                                                }`}
                                                        >
                                                            <p className="text-[10px] font-bold text-gray-800 truncate">{cell.schedule.class}</p>
                                                            <p className="text-[10px] text-gray-500 truncate">{cell.schedule.subject}</p>
                                                            <p className="text-[10px] text-gray-400 truncate">{cell.schedule.teacher}</p>
                                                            <div className="mt-1">
                                                                {cell.attendance?.status ? (
                                                                    <span className={`inline-flex items-center gap-0.5 text-[9px] font-medium ${STATUS[cell.attendance.status].text}`}>
                                                                        {STATUS[cell.attendance.status].icon} {STATUS[cell.attendance.status].label}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[9px] text-gray-300">— غير مسجل</span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ) : (
                                                        <div className="w-full min-h-[72px] rounded-lg bg-gray-50 flex items-center justify-center">
                                                            <span className="text-gray-300 text-xs">—</span>
                                                        </div>
                                                    )}

                                                    {/* Tooltip */}
                                                    {hoveredCell === cellId && cell?.schedule && (
                                                        <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 bg-gray-900 text-white text-[10px] rounded-lg p-2.5 shadow-lg pointer-events-none">
                                                            <p className="font-bold">{cell.schedule.teacher}</p>
                                                            <p className="opacity-80">{cell.schedule.subject} — {cell.schedule.class}</p>
                                                            <p className="opacity-60">🚪 {cell.schedule.room || '—'}</p>
                                                            <p className="opacity-60" dir="ltr">⏱ {cell.schedule.time_start} - {cell.schedule.time_end}</p>
                                                            {cell.attendance?.status && (
                                                                <p className="mt-1 opacity-90">{STATUS[cell.attendance.status].icon} {STATUS[cell.attendance.status].label}</p>
                                                            )}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ═══ Mobile View ═══ */}
                    <div className="sm:hidden divide-y divide-gray-100">
                        {days.map(day => (
                            <div key={day} className="p-3">
                                <h4 className={`text-xs font-bold mb-2 ${day === todayName && nav.isCurrentWeek ? 'text-indigo-700' : 'text-gray-700'
                                    }`}>
                                    {day}
                                    {day === todayName && nav.isCurrentWeek && (
                                        <span className="text-[10px] text-indigo-400 mr-1 font-normal"> (اليوم)</span>
                                    )}
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {timeSlots.map(slot => {
                                        const cell = getCell(day, slot);
                                        if (!cell?.schedule) return null;
                                        return (
                                            <button
                                                key={slot}
                                                onClick={() => setSelectedCell(cell)}
                                                className={`p-2.5 rounded-xl text-right border transition-all active:scale-[0.98] ${cell.attendance?.status
                                                    ? STATUS[cell.attendance.status].bg
                                                    : 'bg-white border-gray-200'
                                                    }`}
                                            >
                                                <p className="text-[10px] text-gray-400 font-mono mb-0.5" dir="ltr">{shortSlot(slot)}</p>
                                                <p className="text-[11px] font-bold text-gray-800 truncate">{cell.schedule.class}</p>
                                                <p className="text-[10px] text-gray-500 truncate">{cell.schedule.teacher}</p>
                                                {cell.attendance?.status && (
                                                    <span className={`text-[9px] ${STATUS[cell.attendance.status].text}`}>
                                                        {STATUS[cell.attendance.status].icon}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ═══ Legend ═══ */}
            <div className="flex items-center justify-center gap-4 px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                {Object.entries(STATUS).map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <span className="text-[10px] text-gray-500">{cfg.label}</span>
                    </div>
                ))}
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                    <span className="text-[10px] text-gray-500">غير مسجل</span>
                </div>
            </div>

            {/* ═══ Cell Detail Modal ═══ */}
            {selectedCell && selectedCell.schedule && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCell(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        {/* Modal header */}
                        <div className="bg-gradient-to-l from-indigo-600 to-blue-700 px-5 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-bold text-sm">{selectedCell.schedule.subject}</h3>
                                <p className="text-white/70 text-xs mt-0.5">
                                    {selectedCell.day} — {selectedCell.schedule.time_start} إلى {selectedCell.schedule.time_end}
                                </p>
                            </div>
                            <button onClick={() => setSelectedCell(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                                <X size={18} className="text-white" />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="p-5 space-y-4">
                            <div className="space-y-2.5 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                                <DetailRow emoji="👨‍🏫" label="الأستاذ" value={selectedCell.schedule.teacher} bold />
                                <DetailRow emoji="🏫" label="القسم" value={selectedCell.schedule.class} />
                                <DetailRow emoji="🚪" label="القاعة" value={selectedCell.schedule.room || '—'} />
                                <DetailRow emoji="📅" label="اليوم" value={selectedCell.day} />
                            </div>

                            {/* Current status */}
                            {selectedCell.attendance?.status && (
                                <div className={`flex items-center gap-2 p-3 rounded-xl border ${STATUS[selectedCell.attendance.status].bg}`}>
                                    <span className="text-lg">{STATUS[selectedCell.attendance.status].icon}</span>
                                    <div>
                                        <p className={`text-sm font-bold ${STATUS[selectedCell.attendance.status].text}`}>
                                            {STATUS[selectedCell.attendance.status].label}
                                        </p>
                                        {selectedCell.attendance.recorded_at && (
                                            <p className="text-[10px] text-gray-400">
                                                سُجّل: {new Date(selectedCell.attendance.recorded_at).toLocaleString('ar-MR')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleRecord(selectedCell.schedule!.id, 'present')}
                                    disabled={recording}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition-colors disabled:opacity-50"
                                >
                                    {recording ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                    حاضر
                                </button>
                                <button
                                    onClick={() => handleRecord(selectedCell.schedule!.id, 'absent')}
                                    disabled={recording}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                    <XCircle size={14} />
                                    غائب
                                </button>
                                <button
                                    onClick={() => handleRecord(selectedCell.schedule!.id, 'late')}
                                    disabled={recording}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors disabled:opacity-50"
                                >
                                    <Clock size={14} />
                                    متأخر
                                </button>
                                <button
                                    onClick={() => handleRecord(selectedCell.schedule!.id, 'excused')}
                                    disabled={recording}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
                                >
                                    <FileText size={14} />
                                    مبرر
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ═══════════ Detail Row ═══════════ */

const DetailRow = ({ emoji, label, value, bold }: { emoji: string; label: string; value: string; bold?: boolean }) => (
    <div className="flex items-center gap-2.5">
        <span className="text-sm">{emoji}</span>
        <span className="text-[11px] text-gray-500 w-12 shrink-0">{label}</span>
        <span className={`text-xs ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{value}</span>
    </div>
);

export default WeeklyCalendar;
