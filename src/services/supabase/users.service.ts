// users.service.ts
import { supabase } from './client';
import { createClient } from '@supabase/supabase-js';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
} from '../../config/supabase.config';
import { User } from '../../types';

export const usersService = {
  // 1. Obtenir les utilisateurs par rôles spécifiques
  getUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .in('role', ['supervisor', 'surveillance'])
      .order('name', { ascending: true });

    if (error) throw error;
    return data as User[];
  },

  // 2. Créer un utilisateur
  createUser: async (userData: {
    email: string;
    password?: string;
    name: string;
    role: 'supervisor' | 'surveillance';
  }) => {
    // ✅ VOIE PRINCIPALE : SERVICE_ROLE_KEY (recommandé, pas de limite)
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: adminData, error: adminError } =
        await adminClient.auth.admin.createUser({
          email: userData.email,
          password: userData.password || '12345678',
          email_confirm: true,
          user_metadata: { name: userData.name, role: userData.role },
        });

      if (adminError) {
        if (adminError.message.toLowerCase().includes('already registered') ||
            adminError.message.toLowerCase().includes('already exists')) {
          throw new Error('Cet email est déjà utilisé par un autre compte.');
        }
        throw new Error(adminError.message);
      }

      const createdUser = adminData.user;

      const { error: dbError } = await supabase
        .from('users')
        .upsert(
          { id: createdUser.id, email: userData.email, name: userData.name, role: userData.role },
          { onConflict: 'id' }
        );

      if (dbError) throw dbError;
      return createdUser;
    }

    // ⚠️ VOIE DE SECOURS : ANON_KEY (limité à ~3 comptes/heure par Supabase)
    // Nécessite que "Confirm email" soit DÉSACTIVÉ dans :
    // Dashboard Supabase → Authentication → Settings → Email confirmations
    const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'temp-auth-creation-key',
        storage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        }
      },
    });

    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email: userData.email,
      password: userData.password || '12345678',
      options: {
        data: { name: userData.name, role: userData.role },
      },
    });

    if (authError) {
      // 400 = email déjà existant OU confirmation d'email activée sur le projet
      if (authError.status === 400) {
        throw new Error(
          authError.message.toLowerCase().includes('already')
            ? 'Cet email est déjà utilisé par un autre compte.'
            : 'Erreur 400 : vérifiez que la confirmation d\'email est désactivée dans votre Dashboard Supabase (Auth → Settings).'
        );
      }
      if (authError.status === 429) {
        throw new Error(
          'Limite Supabase atteinte. Ajoutez VITE_SUPABASE_SERVICE_ROLE_KEY dans votre fichier .env'
        );
      }
      throw new Error(authError.message);
    }

    // Supabase retourne user=null si email non confirmé (même sans erreur)
    const authUser = authData.user;
    if (!authUser) {
      throw new Error(
        'Compte créé mais en attente de confirmation email. Désactivez "Confirm email" dans votre Dashboard Supabase.'
      );
    }

    const { error: dbError } = await supabase
      .from('users')
      .upsert(
        { id: authUser.id, email: userData.email, name: userData.name, role: userData.role },
        { onConflict: 'id' }
      );

    if (dbError) throw dbError;
    return authUser;
  },

  // 3. Mettre à jour Nom et Rôle
  updateUser: async (
    id: string,
    updates: { name?: string; role?: 'supervisor' | 'surveillance' }
  ) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 4. Désactiver un utilisateur (retire ses droits)
  deactivateUser: async (id: string) => {
    const { error } = await supabase
      .from('users')
      .update({ role: null })
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};
