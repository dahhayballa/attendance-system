import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoginPage from '../features/auth/pages/LoginPage';
import AdminDashboard from '../features/admin/pages/AdminDashboard';
import AdminReportsPage from '../features/admin/pages/ReportsPage';
import SupervisorAssignmentsPage from '../features/admin/pages/SupervisorAssignmentsPage';
import UsersManagementPage from '../features/admin/pages/UsersManagementPage';
import LiveDashboardPage from '../features/admin/pages/LiveDashboardPage';
import SupervisorDashboard from '../features/supervisor/pages/Dashboard';
import SupervisorNowPage from '../features/supervisor/pages/SupervisorNowPage';
import ActionHistoryPage from '../features/supervisor/pages/ActionHistoryPage';
import StatisticsPage from '../shared/pages/StatisticsPage';
import SupervisorReportsPage from '../features/supervisor/pages/ReportsPage';
import SettingsPage from '../features/supervisor/pages/SettingsPage';

// Attendance Sub-pages
import TimetablePage from '../features/supervisor/pages/TimetablePage';
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
                path="/admin/users"
                element={
                    <ProtectedRoute requireRole="admin">
                        <UsersManagementPage />
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
            <Route
                path="/admin/statistics"
                element={
                    <ProtectedRoute requireRole="admin">
                        <StatisticsPage />
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
                path="/supervisor/history"
                element={
                    <ProtectedRoute requireRole="supervisor">
                        <ActionHistoryPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/supervisor/statistics"
                element={
                    <ProtectedRoute>
                        <StatisticsPage />
                    </ProtectedRoute>
                }
            />

            {/* Attendance Routes */}
            <Route
                path="/supervisor/timetable"
                element={
                    <ProtectedRoute requireRole="supervisor">
                        <TimetablePage />
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
