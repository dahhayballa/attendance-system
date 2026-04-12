import { useState, useEffect } from 'react';
import { Layout } from '../../../shared/components/layout/Layout';
import { adminService } from '../../../services/supabase/admin.service';
import { usersService } from '../../../services/supabase/users.service';
import { useToast } from '../../../shared/hooks/useToast';
import { 
    FileSearch, Filter, Download, Calendar, 
    User, CheckCircle2, XCircle, Clock, Search, History
} from 'lucide-react';
import Loading from '../../../shared/components/ui/Loading';
import * as XLSX from 'xlsx';

export const AuditLogsPage = () => {
    const { toast } = useToast();
    const [logs, setLogs] = useState<any[]>([]);
    const [supervisors, setSupervisors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [supervisorId, setSupervisorId] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const users = await usersService.getUsers();
            setSupervisors(users);
            await fetchLogs();
        } catch (err) {
            toast.error("Erreur lors du chargement des superviseurs");
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await adminService.getAuditLogs({
                startDate,
                endDate,
                supervisorId,
                status: statusFilter
            });
            setLogs(data);
        } catch (err) {
            toast.error("Erreur lors du chargement des logs");
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (logs.length === 0) return toast.error("Aucune donnée à exporter");
        
        const worksheetData = logs.map(log => ({
            'Date': new Date(log.recorded_at).toLocaleDateString(),
            'Heure': new Date(log.recorded_at).toLocaleTimeString(),
            'Superviseur': log.user_name,
            'Professeur': log.schedule?.teacher,
            'Classe': log.schedule?.class,
            'Matière': log.schedule?.subject,
            'Statut': log.status.toUpperCase(),
            'Note': log.note || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
        
        XLSX.writeFile(workbook, `Audit_Logs_${startDate}_au_${endDate}.xlsx`);
    };

    return (
        <Layout>
            <div className="space-y-6 pb-12" dir="ltr">
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    
                    <div className="relative z-10 flex items-center gap-4 text-left">
                        <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                            <FileSearch size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Registre d'Audit</h2>
                            <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-wide italic">Traçabilité complète des pointages</p>
                        </div>
                    </div>

                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 relative z-10"
                    >
                        <Download size={18} />
                        Export Excel
                    </button>
                </div>

                {/* ── Filter Bar ── */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={12} /> Date Début
                        </label>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={12} /> Date Fin
                        </label>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <User size={12} /> Superviseur
                        </label>
                        <select 
                            value={supervisorId}
                            onChange={(e) => setSupervisorId(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                        >
                            <option value="all">Tous les superviseurs</option>
                            {supervisors.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Filter size={12} /> Statut
                        </label>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="present">Présent</option>
                            <option value="absent">Absent</option>
                            <option value="late">Retard</option>
                            <option value="excused">Correction / Motif</option>
                        </select>
                    </div>
                    <button 
                        onClick={fetchLogs}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                    >
                        <Search size={16} />
                        Filtrer
                    </button>
                </div>

                {/* ── Table ── */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="py-32 flex flex-col items-center justify-center gap-4">
                            <Loading />
                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">Extraction des données...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-32 flex flex-col items-center justify-center gap-4 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                <History size={40} />
                            </div>
                            <div>
                                <h3 className="text-gray-900 font-black uppercase tracking-tight">Aucun log trouvé</h3>
                                <p className="text-gray-400 text-xs mt-1">Essayez d'ajuster vos dates ou filtres de recherche.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-separate border-spacing-0">
                                <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <tr>
                                        <th className="px-6 py-5 border-b border-gray-100">Date/Heure</th>
                                        <th className="px-6 py-5 border-b border-gray-100">Superviseur</th>
                                        <th className="px-6 py-5 border-b border-gray-100">Professeur</th>
                                        <th className="px-6 py-5 border-b border-gray-100">Classe / Matière</th>
                                        <th className="px-6 py-5 border-b border-gray-100">Statut</th>
                                        <th className="px-6 py-5 border-b border-gray-100">Note</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-indigo-50/20 transition-all group">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">{new Date(log.recorded_at).toLocaleDateString()}</span>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase">{new Date(log.recorded_at).toLocaleTimeString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400 font-black text-xs">
                                                        {log.user_name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-gray-700">{log.user_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-black text-gray-900 uppercase tracking-tight text-xs">
                                                {log.schedule?.teacher}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-700">{log.schedule?.class}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 truncate max-w-[150px]">{log.schedule?.subject}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest border shadow-sm flex items-center gap-2 w-fit
                                                    ${log.status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                      log.status === 'absent' ? 'bg-red-50 text-red-600 border-red-100' : 
                                                      log.status === 'late' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                                      'bg-blue-50 text-blue-600 border-blue-100'}
                                                `}>
                                                    {log.status === 'present' ? <CheckCircle2 size={12} /> : 
                                                     log.status === 'absent' ? <XCircle size={12} /> : <Clock size={12} />}
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-gray-400 italic text-[10px] font-medium italic max-w-xs truncate" title={log.note}>
                                                {log.note || '--'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Affichage des 500 derniers enregistrements correspondants aux filtres
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AuditLogsPage;
