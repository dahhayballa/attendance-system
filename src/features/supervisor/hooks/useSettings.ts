import { useState, useEffect, useCallback } from 'react';

/* ═══════════ Types ═══════════ */

export interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    accentColor: 'blue' | 'green' | 'purple';
    fontSize: 'small' | 'medium' | 'large';
    notifications: {
        sound: boolean;
        desktop: boolean;
        critical: boolean;
        warning: boolean;
        info: boolean;
    };
    display: {
        rowsPerPage: number;
        showCurrentSession: boolean;
        showAlerts: boolean;
        autoRefresh: number;
    };
    language: 'ar' | 'fr' | 'en';
    preserveFrenchTerms: boolean;
}

const STORAGE_KEY = 'supervisor_settings';

const DEFAULT_SETTINGS: UserSettings = {
    theme: 'light',
    accentColor: 'blue',
    fontSize: 'medium',
    notifications: {
        sound: false,
        desktop: false,
        critical: true,
        warning: true,
        info: false,
    },
    display: {
        rowsPerPage: 10,
        showCurrentSession: true,
        showAlerts: true,
        autoRefresh: 60,
    },
    language: 'ar',
    preserveFrenchTerms: true,
};

/**
 * Hook central pour gérer tous les paramètres utilisateur.
 * Persiste dans localStorage et applique le thème au document.
 */
export const useSettings = () => {
    const [settings, setSettings] = useState<UserSettings>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        } catch { /* ignore */ }
        return DEFAULT_SETTINGS;
    });

    // ═══ Persist ═══
    const save = useCallback((next: UserSettings) => {
        setSettings(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }, []);

    const update = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        save({ ...settings, [key]: value });
    }, [settings, save]);

    const updateNested = useCallback(<K extends keyof UserSettings>(
        key: K,
        partial: Partial<UserSettings[K]>
    ) => {
        save({ ...settings, [key]: { ...(settings[key] as any), ...partial } });
    }, [settings, save]);

    const resetToDefaults = useCallback(() => {
        save(DEFAULT_SETTINGS);
    }, [save]);

    // ═══ Theme application ═══
    useEffect(() => {
        const root = document.documentElement;

        // Dark mode
        let isDark = settings.theme === 'dark';
        if (settings.theme === 'system') {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Accent color CSS variable
        const accents: Record<string, string> = {
            blue: '59 130 246',
            green: '16 185 129',
            purple: '139 92 246',
        };
        root.style.setProperty('--accent-rgb', accents[settings.accentColor] || accents.blue);

        // Font size
        const sizes: Record<string, string> = { small: '14px', medium: '16px', large: '18px' };
        root.style.fontSize = sizes[settings.fontSize] || '16px';
    }, [settings.theme, settings.accentColor, settings.fontSize]);

    // ═══ System theme listener ═══
    useEffect(() => {
        if (settings.theme !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            document.documentElement.classList.toggle('dark', e.matches);
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [settings.theme]);

    return { settings, update, updateNested, resetToDefaults };
};
