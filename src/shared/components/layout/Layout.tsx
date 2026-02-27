import { ReactNode } from 'react';
import Navbar from './Navbar';

export interface LayoutProps {
    children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
                {children}
            </main>
        </div>
    );
};

export default Layout;
