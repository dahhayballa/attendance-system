import { useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import Sidebar from './Sidebar';

interface SupervisorLayoutProps {
    children: ReactNode;
}

const SupervisorLayout = ({ children }: SupervisorLayoutProps) => {
    const { i18n } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col" dir={dir}>
            {/* Header fixe en haut */}
            <Header
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                sidebarOpen={sidebarOpen}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar à droite (RTL) */}
                <Sidebar
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                {/* Contenu principal */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SupervisorLayout;
