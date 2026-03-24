import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export interface LayoutProps { children: ReactNode; }

export const Layout = ({ children }: LayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex overflow-hidden font-sans" dir="ltr"
            style={{ background: '#f4f5f7' }}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <Header onToggleSidebar={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-5xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;