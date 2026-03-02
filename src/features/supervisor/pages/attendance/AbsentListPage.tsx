import { useState, useEffect, useCallback } from 'react';
import SupervisorLayout from '../../components/SupervisorLayout';
import { supabase } from '../../../../services/supabase/client';
import {
    Search, Download, FileText, UserMinus, CheckCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/* ═══════════ Types ═══════════ */

interface AbsentRecord {
    id: string;
    date: string;
    teacher: string;
    subject: string;
    class: string;
    room: string;
    timeStart: string;
    timeEnd: string;
    notes?: string;
}

/* ═══════════ Page ═══════════ */

const AbsentListPage = () => {
    const [records, setRecords] = useState<AbsentRecord[]>([]);
    const [filtered, setFiltered] = useState<AbsentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [period, setPeriod] = useState<'today' | 'week'>('today');

    const fetchAbsences = useCallback(async () => {
        try {
            setLoading(true);
            const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            const today = days[new Date().getDay()];

            let query = supabase
                .from('schedules')
                .select('*')
                .eq('status', 'absent');

            if (period === 'today') {
                query = query.eq('day', today);
            }

            const { data } = await query;

            if (data) {
                const formatted = data.map(s => ({
                    id: s.id,
                    date: s.day,
                    teacher: s.teacher || '',
                    subject: s.subject || '',
                    class: s.class || '',
                    room: s.room || '',
                    timeStart: s.time_start || '',
                    timeEnd: s.time_end || '',
                }));
                setRecords(formatted);
                setFiltered(formatted);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => { fetchAbsences(); }, [fetchAbsences]);

    useEffect(() => {
        setFiltered(records.filter(r =>
            r.teacher.toLowerCase().includes(search.toLowerCase()) ||
            r.subject.toLowerCase().includes(search.toLowerCase()) ||
            r.class.toLowerCase().includes(search.toLowerCase())
        ));
    }, [search, records]);

    /* ═══════════ Exports ═══════════ */

    const handleExportPDF = () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        doc.setFont('Amiri-Regular', 'normal');
        doc.text(`قائمة الغياب - ${period === 'today' ? 'اليوم' : 'هذا الأسبوع'}`, 105, 20, { align: 'center', dir: 'rtl' } as any);

        const tableData = filtered.map(r => [
            r.notes || '-',
            r.room,
            r.class,
            r.subject,
            `${r.timeStart}-${r.timeEnd}`,
            r.teacher,
            r.date
        ]);

        (doc as any).autoTable({
            head: [['الملاحظات', 'القاعة', 'القسم', 'المادة', 'الوقت', 'الأستاذ', 'اليوم']],
            body: tableData,
            startY: 30,
            styles: { font: 'Amiri-Regular', halign: 'right', dir: 'rtl' },
            headStyles: { fillColor: [59, 130, 246] },
        });

        doc.save(`absent-list-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleExportExcel = () => {
        const data = filtered.map(r => ({
            'اليوم': r.date,
            'الأستاذ': r.teacher,
            'الوقت': `${r.timeStart}-${r.timeEnd}`,
            'المادة': r.subject,
            'القسم': r.class,
            'القاعة': r.room,
            'ملاحظات': r.notes || ''
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'الغياب');
        XLSX.writeFile(wb, `absent-list-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <SupervisorLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">قائمة الغياب</h2>
                        <p className="text-sm text-gray-500 mt-1">حصر حالات الغياب المسجلة {period === 'today' ? 'اليوم' : 'هذا الأسبوع'}</p>
                    </div>

                    <div className="flex items-center bg-gray-100 rounded-xl p-1">
                        <button
                            onClick={() => setPeriod('today')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            اليوم
                        </button>
                        <button
                            onClick={() => setPeriod('week')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            هذا الأسبوع
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="بحث عن أستاذ، قسم مستهدف..."
                            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button onClick={handleExportPDF} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
                            <FileText size={16} /> PDF
                        </button>
                        <button onClick={handleExportExcel} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors">
                            <Download size={16} /> Excel
                        </button>
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} className="text-green-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">لا يوجد غياب مسجل</h3>
                        <p className="text-sm text-gray-500">لم يتم تسجيل أي حالات غياب {period === 'today' ? 'اليوم' : 'في هذا الأسبوع'}</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                            <UserMinus size={16} className="text-red-500" />
                            <h3 className="text-sm font-bold text-gray-900">إجمالي الغياب: {filtered.length}</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {filtered.map((r, i) => (
                                <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                            <span className="text-red-600 font-bold text-sm">{r.teacher.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{r.teacher}</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                {r.date} • {r.timeStart}-{r.timeEnd} • {r.subject} • {r.class} ({r.room})
                                            </p>
                                        </div>
                                    </div>
                                    {r.notes ? (
                                        <div className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg max-w-xs truncate">
                                            {r.notes}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-red-500 font-medium px-2 py-1 bg-red-50 rounded-full border border-red-100">
                                            بدون مبرر
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </SupervisorLayout>
    );
};

export default AbsentListPage;
