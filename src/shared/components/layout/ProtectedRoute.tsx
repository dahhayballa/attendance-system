import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import Loading from '../ui/Loading';

export interface ProtectedRouteProps {
    children: ReactNode;
    requireRole?: 'admin' | 'supervisor';
}

export const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
    const { isAuthenticated, loading, userRole } = useAuth();
    const location = useLocation();

    if (loading) {
        return <Loading fullScreen text="جاري التحقق من الصلاحيات..." />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireRole && userRole && requireRole !== userRole) {
        // Redirect to appropriate dashboard if wrong role
        return <Navigate to={userRole === 'admin' ? '/admin' : '/supervisor'} replace />;
    }

    return children;
};

export default ProtectedRoute;
