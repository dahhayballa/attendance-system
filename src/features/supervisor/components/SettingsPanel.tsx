import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../services/supabase/client';
import { 
    Lock, Globe, LogOut, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

const SettingsPanel = () => {
    const { update } = useSettings();
    const { user, logout } = useAuth();
    const { t, i18n } = useTranslation();
    
    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: t('supervisor.settingsPage.security.error') });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            // 1. Verify Current Password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user?.email || '',
                password: currentPassword
            });

            if (signInError) throw new Error(t('supervisor.settingsPage.security.error'));

            // 2. Update to New Password
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            
            setMessage({ type: 'success', text: t('supervisor.settingsPage.security.success') });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || t('supervisor.settingsPage.security.error') });
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (lang: 'ar' | 'fr') => {
        update('language', lang);
        i18n.changeLanguage(lang);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4 px-2">
            
            {/* 1. Profile Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl uppercase">
                        {(user as any)?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                            {(user as any)?.name || localStorage.getItem('userName') || (user as any)?.user_metadata?.full_name || user?.email?.split('@')[0]}
                        </h3>
                        <p className="text-[10px] text-green-500 font-black uppercase tracking-[2px] mt-0.5 inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            {localStorage.getItem('userRole') || 'Supervisor'}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Preferences (Language) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200">
                    <Globe size={18} className="text-blue-500" />
                    <h3 className="font-bold">{t('supervisor.settingsPage.sections.preferences')}</h3>
                </div>
                
                <div className="flex gap-2">
                    {[
                        { key: 'ar', label: 'العربية', flag: '🇲🇷' },
                        { key: 'fr', label: 'Français', flag: '🇫🇷' }
                    ].map((lang) => (
                        <button
                            key={lang.key}
                            onClick={() => handleLanguageChange(lang.key as any)}
                            className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl border-2 transition-all ${
                                i18n.language === lang.key
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold'
                                : 'border-slate-100 dark:border-slate-800 text-slate-500 bg-white dark:bg-slate-900'
                            }`}
                        >
                            <span className="text-2xl">{lang.flag}</span>
                            <span className="text-sm">{lang.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Security Section - PERSISTENT */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 mb-5">
                    <Lock size={18} className="text-blue-500" />
                    <h3 className="font-bold">{t('supervisor.settingsPage.sections.security')}</h3>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    {message && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                            message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/10 border border-green-100' : 'bg-red-50 text-red-700 dark:bg-red-900/10 border border-red-100'
                        }`}>
                            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {message.text}
                        </div>
                    )}
                    
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-400 dark:text-slate-500 px-1 uppercase tracking-wider">{t('supervisor.settingsPage.security.currentPassword')}</label>
                        <input 
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-all dark:text-white font-bold"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-400 dark:text-slate-500 px-1 uppercase tracking-wider">{t('supervisor.settingsPage.security.newPassword')}</label>
                        <input 
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-all dark:text-white font-bold"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-400 dark:text-slate-500 px-1 uppercase tracking-wider">{t('supervisor.settingsPage.security.confirmPassword')}</label>
                        <input 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-all dark:text-white font-bold"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !newPassword || !currentPassword}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-black transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-3 active:scale-95 mt-2"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                        {t('supervisor.settingsPage.security.updateButton')}
                    </button>
                </form>
            </div>

            {/* 4. Danger Zone (Logout) */}
            <div className="pt-4 pb-12">
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/20 rounded-2xl font-black hover:bg-red-100 transition-all active:scale-[0.98]"
                >
                    <LogOut size={20} />
                    {t('header.logout')}
                </button>
            </div>
        </div>
    );
};

export default SettingsPanel;
