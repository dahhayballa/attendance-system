import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../../services/supabase/client';
import { loginWithEmail, logoutUser } from '../../services/supabase/auth.service';
import { User } from '../../types';

export interface AuthContextType {
  user: User | null;
  userRole: 'admin' | 'supervisor' | 'surveillance' | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ data: any; error: any }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'supervisor' | 'surveillance' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isAuthenticated = !!user;

  /**
   * Fetch role dynamically from public.users table (Source of Truth)
   */
  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AuthProvider] Error fetching role from public.users:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.error('[AuthProvider] Unexpected error during role fetch:', err);
      return null;
    }
  }, []);

  /**
   * Synchronize auth state and database profile
   */
  const refreshSession = useCallback(async () => {
    try {
      // Use getUser() for security (server-side validation)
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        const profile = await fetchUserRole(authUser.id);
        const role = profile?.role as 'admin' | 'supervisor' | 'surveillance' | null;

        const userData: User = {
          id: authUser.id,
          email: authUser.email!,
          name: profile?.name || undefined,
          role: role
        };

        setUser(userData);
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error('[AuthProvider] Session synchronization failed:', error);
      setUser(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUserRole]);

  useEffect(() => {
    refreshSession();

    // Listen to Auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      console.log(`[AuthProvider] Auth Event: ${event}`);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        refreshSession();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  /**
   * Handle Login
   */
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const authData = await loginWithEmail(email, password);
      
      if (authData?.user) {
        const profile = await fetchUserRole(authData.user.id);
        const role = profile?.role as 'admin' | 'supervisor' | 'surveillance' | null;
        
        const currentUser: User = {
          id: authData.user.id,
          email: authData.user.email!,
          name: profile?.name,
          role: role
        };

        setUser(currentUser);
        setUserRole(role);
        
        return { 
          data: { ...authData, resolvedUser: currentUser }, 
          error: null 
        };
      }
      return { data: authData, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Logout
   */
  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('[AuthProvider] Sign out failed:', error);
    } finally {
      setUser(null);
      setUserRole(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {loading ? (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-500 font-medium animate-pulse">Authentification en cours...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
