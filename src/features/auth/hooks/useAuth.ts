import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../../../app/providers/AuthProvider';

/**
 * Hook for accessing the Auth context
 * @throws {Error} if used outside of an AuthProvider
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    
    if (!context || Object.keys(context).length === 0) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    
    return context;
};

export default useAuth;

