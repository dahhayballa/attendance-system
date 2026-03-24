import React, { useEffect, useState } from 'react';
import { WeekUploader } from '../components/WeekUploader';
import { adminService } from '../../../services/supabase/admin.service';
import { useToast } from '../../../shared/hooks/useToast';
import { Loader2, Trash2, Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Layout } from '../../../shared/components/layout/Layout';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, rate: 0 });
  const [weeks, setWeeks] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, weeksData, logsData] = await Promise.all([
        adminService.getGlobalStats(),
        adminService.getWeeksWithCounts(),
        adminService.getRecentLogs()
      ]);
      setStats(statsData);
      setWeeks(weeksData);
      setRecentLogs(logsData);
    } catch (error) {
      toast.error("Échec du chargement des données du tableau de bord");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDeleteWeek = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette semaine ?")) return;
    try {
      await adminService.deleteWeek(id);
      toast.success("Semaine supprimée avec succès");
      loadDashboardData();
    } catch (error) {
      toast.error("Une erreur est survenue lors de la suppression");
    }
  };

  return (
    <Layout>
      <div className="space-y-8" dir="ltr">
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Administrateur</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={loadDashboardData} 
              className="p-2 text-gray-500 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all shadow-sm bg-white border border-gray-100" 
              title="Rafraîchir les données"
            >
              <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Séances" value={stats.total} icon={<Calendar className="text-orange-500" />} color="border-orange-500" bg="bg-orange-50" />
          <StatCard title="Présents" value={stats.present} icon={<CheckCircle className="text-green-500" />} color="border-green-500" bg="bg-green-50" />
          <StatCard title="Absents" value={stats.absent} icon={<XCircle className="text-red-500" />} color="border-red-500" bg="bg-red-50" />
          <StatCard title="Taux de Présence" value={`${stats.rate}%`} icon={<Users className="text-blue-500" />} color="border-blue-500" bg="bg-blue-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Upload & Recent Activity */}
          <div className="space-y-6">
            <WeekUploader onUploadComplete={loadDashboardData} />

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" /> Activité Récente
              </h2>
              <div className="space-y-3">
                {recentLogs.map((log: any) => (
                  <div key={log.id} className="text-sm p-4 bg-gray-50/50 rounded-xl border-l-4 border-orange-400 hover:bg-orange-50/50 transition-colors">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>{log.schedule?.teacher}</span>
                      <span className={log.status === 'present' ? 'text-green-600' : 'text-red-600'}>
                        {log.status === 'present' ? 'Présent' : 'Absent'}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1.5 flex justify-between">
                      <span>{log.schedule?.class}</span>
                      <span className="font-medium">{new Date(log.recorded_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
                {recentLogs.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">Aucune activité enregistrée</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Weeks Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <span className="font-bold text-gray-800">Emplois du temps importés</span>
                <span className="bg-orange-100 text-orange-700 text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider font-bold">Data Storage</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 font-bold">Semaine</th>
                      <th className="p-4 font-bold">Date de début</th>
                      <th className="p-4 font-bold text-center">Séances</th>
                      <th className="p-4 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {weeks.map((week) => (
                      <tr key={week.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="p-4 font-bold text-gray-900">{week.name}</td>
                        <td className="p-4 text-sm font-medium text-gray-600">{new Date(week.start_date).toLocaleDateString('fr-FR')}</td>
                        <td className="p-4 text-center">
                          <span className="bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded-lg text-xs">
                            {week.schedules?.[0]?.count || 0}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleDeleteWeek(week.id)} 
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-all"
                            title="Supprimer la semaine"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {weeks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-400 text-sm">
                          Aucun emploi du temps importé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const StatCard = ({ title, value, icon, color, bg }: any) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border-l-4 ${color} flex items-center justify-between hover:shadow-md transition-all group`}>
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
    </div>
    <div className={`p-4 ${bg} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
  </div>
);

export default AdminDashboard;