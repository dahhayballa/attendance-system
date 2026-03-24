import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { User, LogOut, Globe, Menu } from 'lucide-react';
import LanguageSwitcher from '../ui/LanguageSwitcher';

interface HeaderProps {
    onToggleSidebar?: () => void;
}
import { NotificationBell } from './NotificationBell';

const Header = ({ onToggleSidebar }: HeaderProps) => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30 transition-all duration-500">
            {/* Start side: Menu Toggle or Breadcrumbs */}
            <div className="flex-1 flex justify-start">
                {onToggleSidebar && (
                    <button 
                        onClick={onToggleSidebar}
                        className="lg:hidden p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all active:scale-95"
                    >
                        <Menu size={24} />
                    </button>
                )}
            </div>

            {/* Right side: Actions & User Dropdown */}
            <div className="flex items-center gap-4">
                <NotificationBell />

                <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 p-1.5 pl-3 pr-2 bg-gray-50/50 hover:bg-white hover:shadow-lg hover:shadow-gray-200/50 rounded-2xl border border-gray-100 transition-all duration-300 group ring-4 ring-transparent hover:ring-orange-50"
                >
                    
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 shadow-inner transform group-hover:scale-110 transition-transform duration-300">
                        <User size={20} />
                    </div>

                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute top-full mt-3 end-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-gray-50 mb-3 bg-gray-50/30">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('common.userAccount')}</p>
                            <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                        </div>

                        <div className="space-y-1">
                            <div className="px-4 py-2 flex items-center justify-between text-gray-600 hover:bg-gray-50 transition-colors">
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <Globe size={18} className="text-orange-500" />
                                    {t('common.language')}
                                </span>
                                <div className="scale-90 origin-end">
                                    <LanguageSwitcher />
                                </div>
                            </div>

                            <button
                                onClick={() => logout()}
                                className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm font-bold"
                            >
                                <LogOut size={18} />
                                <span>{t('header.logout')}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            </div>
        </header>
    );
};

export default Header;
