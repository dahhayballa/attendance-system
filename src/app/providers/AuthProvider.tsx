import { createContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../../services/supabase/client';
import { loginWithEmail, logoutUser } from '../../services/supabase/auth.service';
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

/**
 * Récupère le rôle depuis la table public.users.
 * Timeout de 8 secondes pour laisser le temps à Supabase (free tier).
 */
const fetchUserRole = async (userId: string): Promise<'admin' | 'supervisor' | null> => {
    try {
        const result = await Promise.race([
            supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single(),
            new Promise<{ data: null; error: Error }>((resolve) =>
                setTimeout(() => resolve({ data: null, error: new Error('timeout') }), 8000)
            ),
        ]);

        if (result.error) {
            console.warn('[AuthProvider] Erreur récupération rôle:', result.error.message);
            return null;
        }
        return result.data?.role ?? null;
    } catch {
        console.warn('[AuthProvider] Erreur inattendue lors de la récupération du rôle.');
        return null;
    }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<'admin' | 'supervisor' | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const { toast } = useToast();
    const initialSessionProcessed = useRef(false);

    useEffect(() => {
        // 🛡️ Filet de sécurité absolu : si rien ne se passe en 10s → forcer loading=false
        const hardTimeout = setTimeout(() => {
            if (loading) {
                console.warn('[AuthProvider] Hard timeout 10s — loading forcé à false');
                setLoading(false);
            }
        }, 10000);

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AuthProvider] Event:', event, '| Session:', !!session);

            // ═══ INITIAL_SESSION ═══
            // C'est l'event FINAL après que le SDK ait fini d'initialiser
            // → le token est valide à ce stade → on peut faire des requêtes DB
            if (event === 'INITIAL_SESSION') {
                initialSessionProcessed.current = true;
                clearTimeout(hardTimeout);

                if (session?.user) {
                    // D'abord libérer le loading avec un user sans rôle
                    const baseUser: User = {
                        id: session.user.id,
                        email: session.user.email!,
                        role: null,
                    };
                    setUser(baseUser);
                    setLoading(false); // ✅ Spinner disparaît immédiatement

                    // Puis récupérer le rôle en arrière-plan
                    const role = await fetchUserRole(session.user.id);
                    setUser({ ...baseUser, role });
                    setUserRole(role);
                } else {
                    setUser(null);
                    setUserRole(null);
                    setLoading(false);
                }
                return;
            }

            // ═══ SIGNED_IN ═══
            // Pendant l'initialisation, cet event arrive AVANT INITIAL_SESSION
            // avec un token potentiellement encore invalide → on l'IGNORE.
            // Après l'init, c'est un vrai login → on le traite.
            if (event === 'SIGNED_IN') {
                if (!initialSessionProcessed.current) {
                    console.log('[AuthProvider] SIGNED_IN ignoré (avant INITIAL_SESSION)');
                    return; // ← C'est ÇA qui empêche le timeout du rôle
                }
                // Vrai login frais → traité par la fonction login() ci-dessous
                return;
            }

            // ═══ TOKEN_REFRESHED ═══
            if (event === 'TOKEN_REFRESHED' && session?.user) {
                const role = await fetchUserRole(session.user.id);
                setUser({
                    id: session.user.id,
                    email: session.user.email!,
                    role,
                });
                setUserRole(role);
                return;
            }

            // ═══ SIGNED_OUT ═══
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setUserRole(null);
                setLoading(false);
            }
        });

        return () => {
            clearTimeout(hardTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            const data = await loginWithEmail(email, password);

            if (data?.user) {
                const role = await fetchUserRole(data.user.id);
                const currentUser: User = {
                    id: data.user.id,
                    email: data.user.email!,
                    role,
                };
                setUser(currentUser);
                setUserRole(role);
                toast.success('تم تسجيل الدخول بنجاح');
                return { data: { ...data, resolvedUser: currentUser }, error: null };
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
        } catch {
            toast.error('حدث خطأ أثناء تسجيل الخروج');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userRole,
                loading,
                isAuthenticated: !!user,
                isAdmin: userRole === 'admin',
                isSupervisor: userRole === 'supervisor',
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};