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
      toast.error("فشل في تحميل بيانات لوحة التحكم");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDeleteWeek = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الأسبوع؟")) return;
    try {
      await adminService.deleteWeek(id);
      toast.success("تم حذف الأسبوع بنجاح");
      loadDashboardData();
    } catch (error) {
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">لوحة تحكم المسؤول</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={loadDashboardData} 
              className="p-2 text-gray-500 hover:bg-white hover:text-blue-600 rounded-xl transition-all shadow-sm bg-white/50 border border-gray-100 backdrop-blur-sm" 
              title="تحديث البيانات"
            >
              <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="إجمالي الحصص" value={stats.total} icon={<Calendar className="text-blue-500" />} color="border-blue-500" />
          <StatCard title="حاضر" value={stats.present} icon={<CheckCircle className="text-green-500" />} color="border-green-500" />
          <StatCard title="غائب" value={stats.absent} icon={<XCircle className="text-red-500" />} color="border-red-500" />
          <StatCard title="نسبة الحضور" value={`${stats.rate}%`} icon={<Users className="text-purple-500" />} color="border-purple-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Upload & Recent Activity */}
          <div className="space-y-6">
            <WeekUploader onUploadComplete={loadDashboardData} />

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" /> سجل النشاطات الأخير
              </h2>
              <div className="space-y-3">
                {recentLogs.map((log: any) => (
                  <div key={log.id} className="text-sm p-4 bg-gray-50/50 rounded-xl border-r-4 border-blue-400 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>{log.schedule?.teacher}</span>
                      <span className={log.status === 'present' ? 'text-green-600' : 'text-red-600'}>
                        {log.status === 'present' ? 'حاضر' : 'غائب'}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {log.schedule?.class} | {new Date(log.recorded_at).toLocaleTimeString('ar-MA')}
                    </div>
                  </div>
                ))}
                {recentLogs.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">لا توجد نشاطات سجلت بعد</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Weeks Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b bg-gray-50/50 font-bold text-gray-700 flex justify-between items-center">
                <span>الأسابيع المرفوعة</span>
                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Data Storage</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="p-4">الأسبوع</th>
                      <th className="p-4">التاريخ</th>
                      <th className="p-4">الحصص</th>
                      <th className="p-4 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {weeks.map((week) => (
                      <tr key={week.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="p-4 font-bold text-gray-800">{week.name}</td>
                        <td className="p-4 text-sm text-gray-600">{new Date(week.start_date).toLocaleDateString('ar-MA')}</td>
                        <td className="p-4">
                          <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-blue-100">
                            {week.schedules?.[0]?.count || 0}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleDeleteWeek(week.id)} 
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                            title="حذف الأسبوع"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
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

const StatCard = ({ title, value, icon, color }: any) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border-r-4 ${color} flex items-center justify-between hover:shadow-md transition-shadow`}>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
    </div>
    <div className="p-4 bg-gray-50 rounded-2xl text-gray-700">{icon}</div>
  </div>
);

export default AdminDashboard;