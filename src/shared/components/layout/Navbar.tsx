import { LogOut, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import LanguageSwitcher from '../ui/LanguageSwitcher';

export const Navbar = () => {
    const { user, logout, userRole } = useAuth();
    const { t } = useTranslation();

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl" role="img" aria-label="logo">🎓</span>
                        <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
                            {t('navbar.titleFull')}
                        </h1>
                        <h1 className="text-xl font-bold text-gray-900 sm:hidden">
                            {t('navbar.titleShort')}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block">
                            <LanguageSwitcher />
                        </div>
                        {user && (
                            <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-medium text-gray-900 leading-none mb-1">
                                        {user.email?.split('@')[0] || t('navbar.defaultUser')}
                                    </span>
                                    <span className="text-xs text-gray-500 leading-none">
                                        {userRole === 'admin' ? t('navbar.roleAdmin') : t('navbar.roleSupervisor')}
                                    </span>
                                </div>
                                <div className="bg-blue-100 p-1.5 rounded-full text-blue-600">
                                    <User size={16} />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => logout()}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                            title={t('navbar.logoutTitle')}
                        >
                            <LogOut size={20} />
                            <span className="hidden sm:inline text-sm font-medium">
                                {t('navbar.logout')}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
