import { useAuth } from './useAuth';

export const useRole = () => {
    const { userRole, isAdmin, isSupervisor, loading } = useAuth();

    return {
        role: userRole,
        isAdmin,
        isSupervisor,
        isLoading: loading
    };
};

export default useRole;
