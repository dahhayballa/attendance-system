import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoginPage from '../features/auth/pages/LoginPage';
import AdminDashboard from '../features/admin/pages/AdminDashboard';
import AdminReportsPage from '../features/admin/pages/ReportsPage';
import SupervisorAssignmentsPage from '../features/admin/pages/SupervisorAssignmentsPage';
import LiveDashboardPage from '../features/admin/pages/LiveDashboardPage';
import SupervisorDashboard from '../features/supervisor/pages/Dashboard';
import SupervisorNowPage from '../features/supervisor/pages/SupervisorNowPage';
import StatisticsPage from '../features/supervisor/pages/StatisticsPage';
import SupervisorReportsPage from '../features/supervisor/pages/ReportsPage';
import SettingsPage from '../features/supervisor/pages/SettingsPage';

// Attendance Sub-pages
import AttendanceRecordPage from '../features/supervisor/pages/attendance/AttendanceRecordPage';
import AttendanceRecordsPage from '../features/supervisor/pages/attendance/AttendanceRecordsPage';
import TeacherProfilesPage from '../features/supervisor/pages/attendance/TeacherProfilesPage';
import AttendanceCalendarPage from '../features/supervisor/pages/attendance/AttendanceCalendarPage';
import AbsentListPage from '../features/supervisor/pages/attendance/AbsentListPage';

import ProtectedRoute from '../shared/components/layout/ProtectedRoute';
import { useAuth } from '../features/auth/hooks/useAuth';
import Loading from '../shared/components/ui/Loading';

export const Router = () => {
    const { t } = useTranslation();
    const { isAuthenticated, userRole, loading } = useAuth();

    if (loading) {
        return <Loading fullScreen text={t('common.verifyingSession')} />;
    }

    return (
        <Routes>
            {/* Public Route */}
            <Route
                path="/login"
                element={
                    isAuthenticated ? (
                        <Navigate to={userRole === 'admin' ? '/admin' : '/supervisor'} replace />
                    ) : (
                        <LoginPage />
                    )
                }
            />

            {/* Admin Routes */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute requireRole="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/live"
                element={
                    <ProtectedRoute requireRole="admin">
                        <LiveDashboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/supervisors"
                element={
                    <ProtectedRoute requireRole="admin">
                        <SupervisorAssignmentsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/reports"
                element={
                    <ProtectedRoute requireRole="admin">
                        <AdminReportsPage />
                    </ProtectedRoute>
                }
            />

            {/* Supervisor Routes */}
            <Route
                path="/supervisor"
                element={
                    <ProtectedRoute requireRole="supervisor">
                        <SupervisorDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/supervisor/now"
                element={
                    <ProtectedRoute requireRole="supervisor">
                        <SupervisorNowPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/supervisor/statistics"
                element={
                    <ProtectedRoute requireRole="supervisor">
                        <StatisticsPage />
                    </ProtectedRoute>
                }
            />

            {/* Attendance Routes */}
            <Route
                path="/supervisor/attendance"
                element={
                    <ProtectedRoute requireRole="supervisor">
                        <AttendanceRecordPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/supervisor/attendance/records"
                element={
                    <ProtectedRoute requireRole="supervisor">
                        <AttendanceRecordsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/supervisor/attendance/teachers"
                element={
                    <ProtectedRoute requireRole="supervisor">
                        <TeacherProfilesPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/supervisor/attendance/calendar"
                element={
                    <ProtectedRoute requireRole="supervisor">
                        <AttendanceCalendarPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/supervisor/attendance/absent"
                element={
                    <ProtectedRoute requireRole="supervisor">
                        <AbsentListPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/supervisor/reports"
                element={
                    <ProtectedRoute requireRole="supervisor">
                        <SupervisorReportsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/supervisor/settings"
                element={
                    <ProtectedRoute requireRole="supervisor">
                        <SettingsPage />
                    </ProtectedRoute>
                }
            />

            {/* Default Redirect */}
            <Route
                path="*"
                element={<Navigate to="/login" replace />}
            />
        </Routes>
    );
};

export default Router;
