import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/hooks/useAuth';
import {
    LogOut, Moon, Sun, Bell, Menu, X, Clock, User
} from 'lucide-react';
import LanguageSwitcher from '../../../shared/components/ui/LanguageSwitcher';

interface HeaderProps {
    onToggleSidebar: () => void;
    sidebarOpen: boolean;
}

const Header = ({ onToggleSidebar, sidebarOpen }: HeaderProps) => {
    const { user, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const [darkMode, setDarkMode] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [notificationCount] = useState(3);

    // Mise à jour de l'heure en temps réel
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const isArabic = i18n.language.startsWith('ar');

    const locale = isArabic ? 'ar-MR' : i18n.language;

    const formattedDate = currentTime.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const formattedTime = currentTime.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle('dark');
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const userName = user?.email?.split('@')[0] || t('header.defaultUserName');

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center justify-between h-16 px-4 lg:px-6">
                {/* Right side: Menu + Title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        aria-label={t('header.toggleSidebar')}
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">ر</span>
                        </div>
                        <h1 className="text-lg font-bold text-gray-900 hidden sm:block">
                            {t('common.systemName')}
                        </h1>
                    </div>
                </div>

                {/* Center: Date & Time */}
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={14} className="text-gray-400" />
                    <span className="font-medium">{formattedDate}</span>
                    <span className="text-gray-300">|</span>
                    <span className="font-mono text-blue-600 font-semibold" dir="ltr">{formattedTime}</span>
                </div>

                {/* Left side: Actions */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Notification bell */}
                    <button
                        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        aria-label={t('header.notifications')}
                    >
                        <Bell size={20} />
                        {notificationCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                                {notificationCount}
                            </span>
                        )}
                    </button>

                    {/* Dark mode toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        aria-label={t('header.toggleDarkMode')}
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {/* Language switcher */}
                    <div className="hidden md:flex items-center">
                        <LanguageSwitcher />
                    </div>

                    {/* User info */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                        <User size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{userName}</span>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label={t('header.logout')}
                        title={t('header.logout')}
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
