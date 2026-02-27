import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../../services/supabase/client';
import { getCurrentUser, loginWithEmail, logoutUser } from '../../services/supabase/auth.service';
import { useToast } from '../../shared/hooks/useToast';
import { User } from '../../types';

export interface AuthContextType {
    user: User | null;
    userRole: 'admin' | 'supervisor' | null;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSupervisor: boolean;
    login: (email: string, password: string) => Promise<{ data: any; error: any }>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<'admin' | 'supervisor' | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const { toast } = useToast();

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            const currentUser = await getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setUserRole(currentUser.role as 'admin' | 'supervisor' | null);
            } else {
                setUser(null);
                setUserRole(null);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            setUser(null);
            setUserRole(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'SIGNED_IN') {
                await fetchUser();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setUserRole(null);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [fetchUser]);

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            const data = await loginWithEmail(email, password);
            if (data?.user) {
                setUser(data.user as User);
                setUserRole((data.user as User).role as 'admin' | 'supervisor' | null);
                toast.success('تم تسجيل الدخول بنجاح');
            }
            return { data, error: null };
        } catch (error: any) {
            toast.error(error.message || 'فشل في تسجيل الدخول');
            return { data: null, error };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            await logoutUser();
            setUser(null);
            setUserRole(null);
            toast.success('تم تسجيل الخروج');
        } catch (error) {
            toast.error('حدث خطأ أثناء تسجيل الخروج');
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        userRole,
        loading,
        isAuthenticated: !!user,
        isAdmin: userRole === 'admin',
        isSupervisor: userRole === 'supervisor',
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
