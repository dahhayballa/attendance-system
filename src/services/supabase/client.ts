import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/supabase.config';

/**
 * 🍪 Cookie-based storage adapter for Supabase Auth
 * Replaces the default localStorage to avoid XSS token exposure.
 */
const cookieStorage = {
  getItem: (key: string): string | null => {
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
    );
    return match ? decodeURIComponent(match[1]) : null;
  },
  setItem: (key: string, value: string): void => {
    // 6 days expiry — SameSite=Lax prevents CSRF, Secure when on HTTPS
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=518400; SameSite=Lax${secure}`;
  },
  removeItem: (key: string): void => {
    document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: cookieStorage,
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});
