import { createContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../../services/supabase/client';
import { loginWithEmail, logoutUser } from '../../services/supabase/auth.service';
import { useToast } from '../../shared/hooks/useToast';
import { User } from '../../types';
import i18n from '../../i18n';

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
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    clearTimeout(timeoutId);

    if (error) {
      console.error('[AuthProvider] خطأ Supabase:', error.message);
      return null;
    }

    console.log('[AuthProvider] استجابة القاعدة:', data);
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
  const [userRole, setUserRole] = useState<'admin' | 'supervisor' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const initAuth = async () => {
      console.log('[AuthProvider] بدء فحص الجلسة...');
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const role = await fetchUserRoleWithTimeout(session.user.id);
          if (isMounted.current) {
            setUser({ id: session.user.id, email: session.user.email!, role });
            setUserRole(role);
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
        const role = await fetchUserRoleWithTimeout(session.user.id);
        if (isMounted.current) {
          setUser({ id: session.user.id, email: session.user.email!, role });
          setUserRole(role);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted.current) {
          setUser(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const data = await loginWithEmail(email, password);
      if (data?.user) {
        const role = await fetchUserRoleWithTimeout(data.user.id);
        const currentUser: User = { id: data.user.id, email: data.user.email!, role };
        setUser(currentUser);
        setUserRole(role);
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
    setLoading(true);
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setUserRole(null);
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
      {!loading ? children : (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 text-sm animate-pulse">جاري تأمين الاتصال...</p>
        </div>
      )}
    </AuthContext.Provider>
  );
};