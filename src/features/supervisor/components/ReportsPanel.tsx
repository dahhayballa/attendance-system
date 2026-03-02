
import { useReportData, type ReportPeriodType } from '../hooks/useReportData';
import {
    FileText, Download, Printer, Calendar, BarChart3,
    Users, BookOpen, MessageSquare, RefreshCw,
    CheckCircle, XCircle, Clock, AlertTriangle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/* ═══════════ Component ═══════════ */

interface ReportsPanelProps {
    className?: string;
}

const ReportsPanel = ({ className = '' }: ReportsPanelProps) => {
    const { config, updateConfig, report, loading, error, generateReport } = useReportData();

    /* ═══ Export handlers ═══ */

    const exportPDF = () => {
        if (!report) return;
        const doc = new jsPDF({ orientation: 'landscape', putOnlyUsedFonts: true });

        // Header
        doc.setFontSize(16);
        doc.text('Attendance Report', 14, 20);
        doc.setFontSize(10);
        doc.text(`Period: ${report.period.label}`, 14, 28);
        doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString('ar-MR')}`, 14, 34);

        // Summary table
        doc.setFontSize(12);
        doc.text('Summary', 14, 44);

        autoTable(doc, {
            startY: 48,
            head: [['Total', 'Teachers', 'Present', 'Absent', 'Late', 'Rate']],
            body: [[
                report.summary.totalClasses,
                report.summary.totalTeachers,
                report.summary.presentCount,
                report.summary.absentCount,
                report.summary.lateCount,
                `${report.summary.attendanceRate}%`,
            ]],
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
        });

        // Details table
        if (config.includeDetails && report.details.length > 0) {
            const finalY = (doc as any).lastAutoTable?.finalY || 80;
            doc.text('Details', 14, finalY + 10);

            autoTable(doc, {
                startY: finalY + 14,
                head: [['#', 'Teacher', 'Subject', 'Class', 'Room', 'Time', 'Status']],
                body: report.details.map((d, i) => [
                    i + 1, d.teacher, d.subject, d.class, d.room, d.time, d.status
                ]),
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] },
                styles: { fontSize: 8 },
            });
        }

        // Teacher stats
        if (config.includeTeachers && report.byTeacher.length > 0) {
            doc.addPage();
            doc.setFontSize(12);
            doc.text('Teacher Statistics', 14, 20);

            autoTable(doc, {
                startY: 24,
                head: [['Teacher', 'Present', 'Absent', 'Total', 'Rate']],
                body: report.byTeacher.map(t => [
                    t.teacher, t.present, t.absent, t.total, `${t.rate}%`
                ]),
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] },
                styles: { fontSize: 9 },
            });
        }

        doc.save(`attendance_report_${config.startDate}.pdf`);
    };

    const exportExcel = () => {
        if (!report) return;
        const wb = XLSX.utils.book_new();

        // Summary sheet
        const summaryData = [
            ['الفترة', report.period.label],
            ['إجمالي الحصص', report.summary.totalClasses],
            ['عدد الأساتذة', report.summary.totalTeachers],
            ['حاضر', report.summary.presentCount],
            ['غائب', report.summary.absentCount],
            ['متأخر', report.summary.lateCount],
            ['مبرر', report.summary.excusedCount],
            ['نسبة الحضور', `${report.summary.attendanceRate}%`],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'الملخص');

        // Details sheet
        if (report.details.length > 0) {
            const detailRows = report.details.map((d, i) => ({
                '#': i + 1,
                'الأستاذ': d.teacher,
                'المادة': d.subject,
                'القسم': d.class,
                'القاعة': d.room,
                'الوقت': d.time,
                'الحالة': d.status,
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows), 'التفاصيل');
        }

        // Teacher stats sheet
        if (report.byTeacher.length > 0) {
            const teacherRows = report.byTeacher.map(t => ({
                'الأستاذ': t.teacher,
                'حاضر': t.present,
                'غائب': t.absent,
                'إجمالي': t.total,
                'النسبة': `${t.rate}%`,
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teacherRows), 'الأساتذة');
        }

        // Class stats sheet
        if (report.byClass.length > 0) {
            const classRows = report.byClass.map(c => ({
                'القسم': c.class,
                'حاضر': c.present,
                'غائب': c.absent,
                'إجمالي': c.total,
                'النسبة': `${c.rate}%`,
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(classRows), 'الأقسام');
        }

        XLSX.writeFile(wb, `تقرير_الحضور_${config.startDate}.xlsx`);
    };

    const exportCSV = () => {
        if (!report) return;
        const rows = report.details.map(d =>
            [d.date, d.teacher, d.subject, d.class, d.room, d.time, d.status].join(',')
        );
        const csv = '\uFEFF' + ['اليوم,الأستاذ,المادة,القسم,القاعة,الوقت,الحالة', ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير_${config.startDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        setTimeout(() => window.print(), 300);
    };

    return (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-l from-indigo-50 to-blue-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <FileText size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-gray-900 text-sm">التقارير والتصدير</h3>
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* ═══ Report Type ═══ */}
                <div>
                    <label className="text-xs font-bold text-gray-700 mb-2 block flex items-center gap-1.5">
                        <BarChart3 size={14} className="text-indigo-500" />
                        نوع التقرير
                    </label>
                    <div className="flex gap-2">
                        {([
                            { key: 'daily', label: 'يومي' },
                            { key: 'weekly', label: 'أسبوعي' },
                            { key: 'monthly', label: 'شهري' },
                            { key: 'custom', label: 'مخصص' },
                        ] as { key: ReportPeriodType; label: string }[]).map(t => (
                            <button
                                key={t.key}
                                onClick={() => updateConfig({ periodType: t.key })}
                                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${config.periodType === t.key
                                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ═══ Date Picker ═══ */}
                <div>
                    <label className="text-xs font-bold text-gray-700 mb-2 block flex items-center gap-1.5">
                        <Calendar size={14} className="text-blue-500" />
                        الفترة
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={config.startDate}
                            onChange={(e) => updateConfig({ startDate: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-300"
                        />
                        {(config.periodType === 'custom' || config.periodType === 'weekly' || config.periodType === 'monthly') && (
                            <>
                                <span className="text-gray-400 text-xs self-center">إلى</span>
                                <input
                                    type="date"
                                    value={config.endDate}
                                    onChange={(e) => updateConfig({ endDate: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-300"
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* ═══ Content Options ═══ */}
                <div>
                    <label className="text-xs font-bold text-gray-700 mb-2 block flex items-center gap-1.5">
                        <BookOpen size={14} className="text-green-500" />
                        محتوى التقرير
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <CheckOption
                            label="قائمة الأساتذة"
                            checked={config.includeTeachers}
                            onChange={(v) => updateConfig({ includeTeachers: v })}
                            icon={<Users size={13} />}
                        />
                        <CheckOption
                            label="إحصائيات الحضور"
                            checked={config.includeStats}
                            onChange={(v) => updateConfig({ includeStats: v })}
                            icon={<BarChart3 size={13} />}
                        />
                        <CheckOption
                            label="تفاصيل الحصص"
                            checked={config.includeDetails}
                            onChange={(v) => updateConfig({ includeDetails: v })}
                            icon={<FileText size={13} />}
                        />
                        <CheckOption
                            label="ملاحظات"
                            checked={config.includeNotes}
                            onChange={(v) => updateConfig({ includeNotes: v })}
                            icon={<MessageSquare size={13} />}
                        />
                    </div>
                </div>

                {/* ═══ Generate Button ═══ */}
                <button
                    onClick={generateReport}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-l from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <><RefreshCw size={16} className="animate-spin" /> جاري الإنشاء...</>
                    ) : (
                        <><Download size={16} /> إنشاء التقرير</>
                    )}
                </button>

                {error && (
                    <p className="text-xs text-red-500 text-center">{error}</p>
                )}

                {/* ═══ Report Preview ═══ */}
                {report && (
                    <div className="space-y-4">
                        <hr className="border-gray-200" />

                        {/* Summary cards */}
                        <div className="grid grid-cols-2 gap-2">
                            <MiniCard icon={<CheckCircle size={14} />} label="حاضر" value={report.summary.presentCount} color="green" />
                            <MiniCard icon={<XCircle size={14} />} label="غائب" value={report.summary.absentCount} color="red" />
                            <MiniCard icon={<Clock size={14} />} label="متأخر" value={report.summary.lateCount} color="amber" />
                            <MiniCard icon={<AlertTriangle size={14} />} label="غير مسجل" value={report.summary.pendingCount} color="gray" />
                        </div>

                        {/* Rate bar */}
                        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-600 font-medium">نسبة الحضور</span>
                                <span className={`text-lg font-bold ${report.summary.attendanceRate >= 80 ? 'text-green-600' :
                                    report.summary.attendanceRate >= 50 ? 'text-amber-600' : 'text-red-600'
                                    }`}>
                                    {report.summary.attendanceRate}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${report.summary.attendanceRate}%`,
                                        backgroundColor: report.summary.attendanceRate >= 80 ? '#10B981' :
                                            report.summary.attendanceRate >= 50 ? '#F59E0B' : '#EF4444'
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                <span>{report.summary.totalClasses} حصص</span>
                                <span>{report.summary.totalTeachers} أستاذ</span>
                            </div>
                        </div>

                        {/* Top absentees */}
                        {config.includeTeachers && report.byTeacher.filter(t => t.absent > 0).length > 0 && (
                            <div>
                                <h4 className="text-[11px] font-bold text-gray-700 mb-2">أكثر الأساتذة غياباً</h4>
                                <div className="space-y-1.5">
                                    {report.byTeacher.filter(t => t.absent > 0).slice(0, 5).map(t => (
                                        <div key={t.teacher} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                                            <span className="text-xs text-gray-800 font-medium">{t.teacher}</span>
                                            <span className="text-[11px] text-red-600 font-bold">{t.absent} غياب ({t.rate}%)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Export buttons */}
                        <div className="grid grid-cols-4 gap-2">
                            <ExportBtn label="PDF" icon={<FileText size={14} />} color="red" onClick={exportPDF} />
                            <ExportBtn label="Excel" icon={<BarChart3 size={14} />} color="green" onClick={exportExcel} />
                            <ExportBtn label="CSV" icon={<Download size={14} />} color="blue" onClick={exportCSV} />
                            <ExportBtn label="طباعة" icon={<Printer size={14} />} color="gray" onClick={handlePrint} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ═══════════ Sub-components ═══════════ */

const CheckOption = ({ label, checked, onChange, icon }: {
    label: string; checked: boolean; onChange: (v: boolean) => void; icon: React.ReactNode;
}) => (
    <button
        onClick={() => onChange(!checked)}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-medium border transition-all ${checked
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
    >
        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
            }`}>
            {checked && <CheckCircle size={10} className="text-white" />}
        </div>
        {icon}
        {label}
    </button>
);

const MiniCard = ({ icon, label, value, color }: {
    icon: React.ReactNode; label: string; value: number; color: string;
}) => {
    const colors: Record<string, string> = {
        green: 'bg-green-50 border-green-200 text-green-600',
        red: 'bg-red-50 border-red-200 text-red-600',
        amber: 'bg-amber-50 border-amber-200 text-amber-600',
        gray: 'bg-gray-50 border-gray-200 text-gray-500',
    };
    return (
        <div className={`rounded-xl border p-3 text-center ${colors[color] || colors.gray}`}>
            <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-[10px]">{label}</p>
        </div>
    );
};

const ExportBtn = ({ label, icon, color, onClick }: {
    label: string; icon: React.ReactNode; color: string; onClick: () => void;
}) => {
    const colors: Record<string, string> = {
        red: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',
        green: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
        gray: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
    };
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[10px] font-medium transition-colors ${colors[color] || colors.gray}`}
        >
            {icon}
            {label}
        </button>
    );
};

export default ReportsPanel;
