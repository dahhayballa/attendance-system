import { useStats } from '../hooks/useStats';
import StatsCard from '../components/StatsCard';
import ActivityLog from '../components/ActivityLog';
import WeekUploader from '../components/WeekUploader';
import { Layout } from '../../../shared/components/layout/Layout';
import { Calendar, Users, CheckCircle, Percent } from 'lucide-react';

export const AdminDashboard = () => {
    const { stats, recentLogs, loading, error, refetch } = useStats();

    return (
        <Layout>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">لوحة تحكم المدير</h2>
                        <p className="text-sm text-gray-500 mt-1">نظرة عامة على إحصائيات الحضور الأسبوعية</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.location.href = '/admin/reports'}
                            className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm focus:outline-none"
                        >
                            التقارير المفصلة
                        </button>
                        <button
                            onClick={refetch}
                            className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors shadow-sm focus:outline-none"
                        >
                            تحديث الإحصائيات
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
                        {error}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <StatsCard
                        title="إجمالي الحصص"
                        value={stats?.total || 0}
                        icon={<Calendar className="h-6 w-6 text-blue-600" />}
                        variant="total"
                    />
                    <StatsCard
                        title="الحصص المسجلة"
                        value={stats?.recorded || 0}
                        icon={<CheckCircle className="h-6 w-6 text-green-600" />}
                        variant="success"
                    />
                    <StatsCard
                        title="قيد الانتظار"
                        value={stats?.pending || 0}
                        icon={<Users className="h-6 w-6 text-yellow-600" />}
                        variant="warning"
                    />
                    <StatsCard
                        title="نسبة الحضور"
                        value={`${stats?.rate || 0}%`}
                        icon={<Percent className="h-6 w-6 text-gray-600" />}
                        variant="info"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Uploader Section */}
                    <div className="lg:col-span-1">
                        <WeekUploader onUploadComplete={refetch} />
                    </div>

                    {/* Activity Log Section */}
                    <div className="lg:col-span-2">
                        <ActivityLog logs={recentLogs} loading={loading} />
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AdminDashboard;
