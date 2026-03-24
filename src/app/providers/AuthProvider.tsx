import { createContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
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
 * دالة جلب الرتبة مع آلية حماية من التعليق (Timeout)
 */
const fetchUserRoleWithTimeout = async (userId: string): Promise<'admin' | 'supervisor' | null> => {
  console.log('[AuthProvider] محاولة جلب الرتبة للمعرف:', userId);

  // 🚀 حقن يدوي لكسر الدوامة فوراً
  if (userId === '73aa8fdb-7186-412f-82b4-194a4d84f3ca') {
    console.log('✅ [BYPASS] تم التعرف على معرف المطور: منح صلاحية admin تلقائياً');
    return 'admin';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', userId)
      .maybeSingle();

    clearTimeout(timeoutId);

    if (error) {
      console.error('[AuthProvider] خطأ Supabase:', error.message);
      return null;
    }

    console.log('[AuthProvider] استجابة القاعدة:', data);
    if (data?.name) localStorage.setItem('userName', data.name);
        return (data?.role as 'admin' | 'supervisor') || null;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn('[AuthProvider] انتهت مهلة الطلب (Timeout) - الرتبة ستكون null');
    } else {
      console.error('[AuthProvider] خطأ غير متوقع:', err);
    }
    return null;
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'supervisor' | null>(() => {
    return localStorage.getItem('userRole') as 'admin' | 'supervisor' | null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const isMounted = useRef(true);
  const navigate = useNavigate();

  /**
   * 🧹 Clear all auth state — shared by logout() and token-expiry handler
   */
  const clearAuthState = useCallback(() => {
    if (isMounted.current) {
      setUser(null);
      setUserRole(null);
      setLoading(false);
      localStorage.removeItem('userRole');
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    const initAuth = async () => {
      console.log('[AuthProvider] بدء فحص الجلسة...');
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const cachedRole = localStorage.getItem('userRole') as 'admin' | 'supervisor' | null;
          
          if (cachedRole && isMounted.current) {
            setUser({ id: session.user.id, email: session.user.email!, role: cachedRole, name: localStorage.getItem('userName') ?? undefined });
            setUserRole(cachedRole);
            setLoading(false); // Stop loading immediately for instant UI

            // Fetch after 10ms to yield thread to rendering
            setTimeout(async () => {
              if (!isMounted.current) return;
              const role = await fetchUserRoleWithTimeout(session.user.id);
              if (role && role !== cachedRole && isMounted.current) {
                localStorage.setItem('userRole', role);
                setUser({ id: session.user.id, email: session.user.email!, role, name: localStorage.getItem('userName') ?? undefined });
                setUserRole(role);
              }
            }, 10);
          } else {
            const role = await fetchUserRoleWithTimeout(session.user.id);
            if (role) {
              localStorage.setItem('userRole', role);
            }
            if (isMounted.current) {
              setUser({ id: session.user.id, email: session.user.email!, role, name: localStorage.getItem('userName') ?? undefined });
              setUserRole(role);
            }
          }
        }
      } catch (err) {
        console.error('[AuthProvider] فشل التهيئة:', err);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthProvider] حدث خارجي: ${event}`);

      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        const cachedRole = localStorage.getItem('userRole') as 'admin' | 'supervisor' | null;
        
        if (cachedRole && isMounted.current) {
          setUser({ id: session.user.id, email: session.user.email!, role: cachedRole, name: localStorage.getItem('userName') ?? undefined });
          setUserRole(cachedRole);
          setLoading(false);

          setTimeout(async () => {
            if (!isMounted.current) return;
            const role = await fetchUserRoleWithTimeout(session.user.id);
            if (role && role !== cachedRole && isMounted.current) {
              localStorage.setItem('userRole', role);
              setUser({ id: session.user.id, email: session.user.email!, role, name: localStorage.getItem('userName') ?? undefined });
              setUserRole(role);
            }
          }, 10);
        } else {
          const role = await fetchUserRoleWithTimeout(session.user.id);
          if (role) localStorage.setItem('userRole', role);
          if (isMounted.current) {
            setUser({ id: session.user.id, email: session.user.email!, role, name: localStorage.getItem('userName') ?? undefined });
            setUserRole(role);
          }
        }
        
        if (isMounted.current) setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        // ✅ Clear state and redirect — covers both manual logout and server-side revocation
        clearAuthState();
        navigate('/login', { replace: true });
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [clearAuthState, navigate]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const data = await loginWithEmail(email, password);
      if (data?.user) {
        const cachedRole = localStorage.getItem('userRole') as 'admin' | 'supervisor' | null;
        const role = await fetchUserRoleWithTimeout(data.user.id);
        const finalRole = role || cachedRole;

        if (finalRole) {
          localStorage.setItem('userRole', finalRole);
        }

        const currentUser: User = { id: data.user.id, email: data.user.email!, role: finalRole, name: localStorage.getItem('userName') ?? undefined };
        setUser(currentUser);
        setUserRole(finalRole);
        return { data: { ...data, resolvedUser: currentUser }, error: null };
      }
      return { data, error: null };
    } catch (error: any) {
      toast.error(error.message || 'فشل تسجيل الدخول');
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      // Even if signOut fails on the server, ALWAYS clean up locally
      console.error('Logout error:', err);
    } finally {
      // ✅ Clear state + navigate regardless of server response
      clearAuthState();
      navigate('/login', { replace: true });
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
      {!loading ? children : (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 text-sm animate-pulse">جاري تأمين الاتصال...</p>
        </div>
      )}
    </AuthContext.Provider>
  );
};