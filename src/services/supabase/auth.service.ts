import { supabase } from './client';
import { User } from '../../types';

export const loginWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;

    let formattedUser: User | null = null;

    if (data?.user) {
        const { data: roleData, error: roleError } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single();

        formattedUser = {
            id: data.user.id,
            email: data.user.email!,
            role: (!roleError && roleData) ? roleData.role : null
        };
    }

    return { ...data, user: formattedUser };
};

export const logoutUser = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const getCurrentSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
};

export const getCurrentUser = async (): Promise<User | null> => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;

    if (user) {
        const { data: roleData, error: roleError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        return {
            id: user.id,
            email: user.email!,
            role: (!roleError && roleData) ? roleData.role : null
        };
    }

    return null;
};
