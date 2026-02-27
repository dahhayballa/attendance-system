import { supabase } from './client';
import { User } from '../../types';

/**
 * 🔐 Login with email & password
 */
export const loginWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;

    return data;
};

/**
 * 🚪 Logout — scope 'local' car 'global' nécessite service_role key (403)
 */
export const logoutUser = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
};

/**
 * 📦 Get current session
 */
export const getCurrentSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
};

/**
 * 👤 Get current user + role
 * (تُستعمل عند refresh و INITIAL_SESSION)
 */
export const getCurrentUser = async (): Promise<User | null> => {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.user) {
        return null;
    }

    const user = data.session.user;

    // Récupère le rôle (et le nom) depuis la table public.users
    const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', user.id)
        .single();

    if (profileError) {
        // L'utilisateur Auth existe mais n'a pas de ligne dans public.users,
        // ou la policy RLS bloque. On retourne quand même l'utilisateur sans rôle.
        console.warn('[getCurrentUser] Impossible de récupérer le profil:', profileError.message);
        return {
            id: user.id,
            email: user.email!,
            role: null,
        };
    }

    return {
        id: user.id,
        email: user.email!,
        role: profileData?.role ?? null,
    };
};