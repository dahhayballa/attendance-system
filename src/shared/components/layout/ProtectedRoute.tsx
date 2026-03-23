import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import Loading from '../ui/Loading';

export interface ProtectedRouteProps {
    children: ReactNode;
    requireRole?: 'admin' | 'supervisor';
}

export const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
    const { isAuthenticated, loading, userRole } = useAuth();
    const { t } = useTranslation();
    const location = useLocation();

    if (loading) {
        return <Loading fullScreen text={t('protectedRoute.verifyingPermissions')} />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireRole && requireRole !== userRole) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center max-w-sm w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Accès non autorisé</h2>
                    <p className="text-sm text-gray-500">
                        Ce compte n'est pas autorisé à accéder à cette section.
                    </p>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
