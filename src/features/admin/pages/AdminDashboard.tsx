import React, { useEffect, useState } from 'react';
import { WeekUploader } from '../components/WeekUploader'; // تأكد من المسار
import { adminService } from '../../../services/supabase/admin.service';
import { useToast } from '../../../shared/hooks/useToast';
import { Loader2, Trash2, Calendar, Users, CheckCircle, XCircle, Clock, LogOut } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, rate: 0 });
  const [weeks, setWeeks] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]); // حالة جديدة للسجلات
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { logout } = useAuth();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, weeksData, logsData] = await Promise.all([
        adminService.getGlobalStats(),
        adminService.getWeeksWithCounts(),
        adminService.getRecentLogs() // تأكد من إضافة هذه الدالة في admin.service
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
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-right" dir="rtl">
      {/* الرأس والإحصائيات */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">لوحة تحكم المسؤول</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => window.location.href = '/admin/live'} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors">
            لوحة المراقبة الحية
          </button>
          <button onClick={() => window.location.href = '/admin/supervisors'} className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors">
            إدارة المشرفين
          </button>
          <button onClick={() => window.location.href = '/admin/reports'} className="px-4 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
            التقارير المتقدمة
          </button>
          <button onClick={loadDashboardData} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="تحديث البيانات">
            <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={logout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors border border-red-100" title="تسجيل الخروج">
            <span className="text-sm font-medium hidden sm:inline">خروج</span>
            <LogOut className="w-4 h-4" />
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
        {/* رفع الملفات + النشاطات الأخيرة */}
        <div className="space-y-6">
          <WeekUploader onUploadComplete={loadDashboardData} /> {/* تم تعديل المسمى هنا ليتطابق مع المكون */}

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" /> سجل النشاطات الأخير
            </h2>
            <div className="space-y-3">
              {recentLogs.map((log: any) => (
                <div key={log.id} className="text-sm p-3 bg-gray-50 rounded-lg border-r-2 border-blue-400">
                  <div className="flex justify-between font-medium">
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
              {recentLogs.length === 0 && <p className="text-center text-gray-400 py-4">لا توجد نشاطات سجلت بعد</p>}
            </div>
          </div>
        </div>

        {/* جدول الأسابيع */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50/50 font-bold text-gray-700">الأسابيع المرفوعة</div>
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="p-4">الأسبوع</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">الحصص</th>
                  <th className="p-4 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {weeks.map((week) => (
                  <tr key={week.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium">{week.name}</td>
                    <td className="p-4 text-sm">{new Date(week.start_date).toLocaleDateString('ar-MA')}</td>
                    <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{week.schedules?.[0]?.count || 0}</span></td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleDeleteWeek(week.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
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
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className={`bg-white p-5 rounded-xl shadow-sm border-r-4 ${color} flex items-center justify-between`}>
    <div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
    <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
  </div>
);
export default AdminDashboard;