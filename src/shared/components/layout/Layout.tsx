import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTranslation } from 'react-i18next';

export interface LayoutProps {
    children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { i18n } = useTranslation();
    const dir = i18n.language && i18n.language.startsWith('ar') ? 'rtl' : 'ltr';

    return (
        <div className="min-h-screen bg-gray-50 flex overflow-hidden font-sans" dir={dir}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                <Header onToggleSidebar={() => setSidebarOpen(true)} />

                <main className={`flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 h-full relative z-0 animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </main>
                
                {/* Visual enhancements */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-50/20 blur-[100px] pointer-events-none rounded-full translate-x-1/2 -translate-y-1/2"></div>
            </div>
        </div>
    );
};

export default Layout;
