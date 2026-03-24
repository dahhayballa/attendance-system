import { useState, useEffect } from 'react';
import { Layout } from '../../../shared/components/layout/Layout';
import Card from '../../../shared/components/ui/Card';
import Button from '../../../shared/components/ui/Button';
import Input from '../../../shared/components/ui/Input';
import Badge from '../../../shared/components/ui/Badge';
import { getAttendanceLogs } from '../../../services/supabase/attendance.service';
import { formatDate, formatTime } from '../../../shared/utils/formatters';
import { Search, Download, Filter, FileText } from 'lucide-react';
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
            'Date': formatDate(log.created_at),
            'Heure': formatTime(log.created_at),
            'Superviseur': log.user_name,
            'Professeur': log.teacher_name,
            'Matière': log.subject,
            'Statut': log.status === 'present' ? 'Présent' : log.status === 'absent' ? 'Absent' : log.status === 'late' ? 'Retard' : 'Motif'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rapport Presences");
        XLSX.writeFile(wb, `Rapport_Presences_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`);
    };

    return (
        <Layout>
            <div className="flex flex-col gap-6" dir="ltr">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Rapports Détaillés</h2>
                            <p className="text-sm font-medium text-gray-500 mt-1">Historique complet de toutes les présences enregistrées</p>
                        </div>
                    </div>
                    <Button 
                        onClick={exportToExcel} 
                        disabled={loading || filteredLogs.length === 0} 
                        leftIcon={<Download size={18} />}
                        className="bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-300 border-transparent shadow-sm whitespace-nowrap"
                    >
                        Exporter en Excel
                    </Button>
                </div>

                <Card padding="p-0" className="shadow-sm border-gray-100">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="w-full md:w-1/3 relative">
                            <Input
                                placeholder="Rechercher professeur, superviseur, classe..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                leftIcon={<Search className="h-5 w-5 text-gray-400" />}
                                className="bg-white border-gray-200 focus:border-orange-500 focus:ring-orange-200 shadow-sm"
                            />
                        </div>
                        <div className="w-full md:w-auto flex gap-3">
                            {/* Placeholders for advanced filters like Week/Supervisor */}
                            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 focus:outline-none transition-all shadow-sm w-full md:w-auto">
                                <Filter size={16} /> Filtres
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-gray-500 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-4 font-bold">Date</th>
                                    <th scope="col" className="px-6 py-4 font-bold">Heure</th>
                                    <th scope="col" className="px-6 py-4 font-bold">Superviseur</th>
                                    <th scope="col" className="px-6 py-4 font-bold">Professeur</th>
                                    <th scope="col" className="px-6 py-4 font-bold">Matière</th>
                                    <th scope="col" className="px-6 py-4 font-bold">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, idx) => (
                                        <tr key={idx} className="bg-white animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-28"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-40"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-lg w-20"></div></td>
                                        </tr>
                                    ))
                                ) : filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="bg-white hover:bg-orange-50/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                                            <td className="px-6 py-4 text-gray-400 font-mono font-bold" dir="ltr">{formatTime(log.created_at)}</td>
                                            <td className="px-6 py-4 text-gray-600 font-medium">{log.user_name}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{log.teacher_name}</td>
                                            <td className="px-6 py-4 text-gray-600">{log.subject}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={log.status}>{log.status === 'present' ? 'Présent' : log.status === 'absent' ? 'Absent' : log.status === 'late' ? 'Retard' : 'Motif'}</Badge>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search size={24} className="text-gray-300" />
                                            </div>
                                            <h3 className="font-bold text-gray-600 mb-1">Aucun résultat</h3>
                                            <p className="text-gray-400 text-sm">Aucune donnée ne correspond à votre recherche.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 font-medium text-xs text-gray-500 flex justify-between items-center rounded-b-2xl">
                        <span>Affichage de {filteredLogs.length} enregistrement(s)</span>
                    </div>
                </Card>
            </div>
        </Layout>
    );
};

export default ReportsPage;
