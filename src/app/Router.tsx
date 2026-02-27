import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage';
import AdminDashboard from '../features/admin/pages/AdminDashboard';
import ReportsPage from '../features/admin/pages/ReportsPage';
import SupervisorPage from '../features/supervisor/pages/SupervisorPage';
import ProtectedRoute from '../shared/components/layout/ProtectedRoute';
import { useAuth } from '../features/auth/hooks/useAuth';
import Loading from '../shared/components/ui/Loading';

export const Router = () => {
    const { isAuthenticated, userRole, loading } = useAuth();

    // ✅ Afficher un spinner pendant que la session est vérifiée
    // (ne jamais retourner null → page blanche)
    if (loading) {
        return <Loading fullScreen text="جاري التحقق من الجلسة..." />;
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
                path="/admin/reports"
                element={
                    <ProtectedRoute requireRole="admin">
                        <ReportsPage />
                    </ProtectedRoute>
                }
            />

            {/* Supervisor Routes */}
            <Route
                path="/supervisor"
                element={
                    <ProtectedRoute requireRole="supervisor">
                        <SupervisorPage />
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
