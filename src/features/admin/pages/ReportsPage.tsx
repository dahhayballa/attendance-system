import { useState, useEffect } from 'react';
import { Layout } from '../../../shared/components/layout/Layout';
import Card from '../../../shared/components/ui/Card';
import Button from '../../../shared/components/ui/Button';
import Input from '../../../shared/components/ui/Input';
import Badge from '../../../shared/components/ui/Badge';
import { getAttendanceLogs } from '../../../services/supabase/attendance.service';
import { formatDate, formatTime } from '../../../shared/utils/formatters';
import { Search, Download, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AttendanceLog } from '../../../types';

export const ReportsPage = () => {
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const data = await getAttendanceLogs({ limit: 100 });
                setLogs(data);
            } catch (error) {
                console.error('Error fetching logs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportToExcel = () => {
        const dataToExport = filteredLogs.map(log => ({
            'التاريخ': formatDate(log.created_at),
            'الوقت': formatTime(log.created_at),
            'المراقب': log.user_name,
            'الأستاذ': log.teacher_name,
            'المادة': log.subject,
            'الحالة': log.status === 'present' ? 'حاضر' : log.status === 'absent' ? 'غائب' : log.status
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
        XLSX.writeFile(wb, `تقرير_الحضور_${new Date().toLocaleDateString('ar-MR')}.xlsx`);
    };

    return (
        <Layout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">التقارير المفصلة</h2>
                        <p className="text-sm text-gray-500 mt-1">سجل كامل بجميع عمليات تسجيل الحضور</p>
                    </div>
                    <Button onClick={exportToExcel} disabled={loading || filteredLogs.length === 0} leftIcon={<Download size={18} />}>
                        تصدير للإكسل
                    </Button>
                </div>

                <Card padding="p-0">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-4 items-center">
                        <div className="w-full md:w-1/3 relative">
                            <Input
                                placeholder="ابحث عن أستاذ، مراقب، أو مادة..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                leftIcon={<Search className="h-5 w-5 text-gray-400" />}
                                className="bg-white"
                            />
                        </div>
                        <div className="w-full md:w-2/3 flex gap-2">
                            {/* Placeholders for advanced filters like Week/Supervisor */}
                            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                                <Filter size={16} /> تصفية متقدمة
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th scope="col" className="px-6 py-3 font-medium">التاريخ</th>
                                    <th scope="col" className="px-6 py-3 font-medium">الوقت</th>
                                    <th scope="col" className="px-6 py-3 font-medium">المراقب</th>
                                    <th scope="col" className="px-6 py-3 font-medium">الأستاذ</th>
                                    <th scope="col" className="px-6 py-3 font-medium">المادة</th>
                                    <th scope="col" className="px-6 py-3 font-medium">الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, idx) => (
                                        <tr key={idx} className="border-b border-gray-100 animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
                                        </tr>
                                    ))
                                ) : filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="bg-white border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(log.created_at)}</td>
                                            <td className="px-6 py-4 text-gray-500 font-mono" dir="ltr">{formatTime(log.created_at)}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{log.user_name}</td>
                                            <td className="px-6 py-4 font-bold text-gray-800">{log.teacher_name}</td>
                                            <td className="px-6 py-4 text-gray-600">{log.subject}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={log.status}>{log.status === 'present' ? 'حاضر' : 'غائب'}</Badge>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            لا توجد بيانات تطابق بحثك.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-500 flex justify-between items-center">
                        <span>عرض {filteredLogs.length} من السجلات</span>
                    </div>
                </Card>
            </div>
        </Layout>
    );
};

export default ReportsPage;
