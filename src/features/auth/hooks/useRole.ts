import { useAuth } from './useAuth';

/**
 * Hook to manage and derive user roles dynamically
 * Based on the 'role' field from public.users table (Source of Truth)
 */
export const useRole = () => {
    const { userRole, loading } = useAuth();

    return {
        role: userRole,
        isAdmin: userRole === 'admin',
        isSupervisor: userRole === 'supervisor',
        isSurveillance: userRole === 'surveillance',
        isLoading: loading
    };
};

export default useRole;

