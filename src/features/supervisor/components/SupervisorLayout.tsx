import { ReactNode } from 'react';
import { Layout } from '../../../shared/components/layout/Layout';

interface SupervisorLayoutProps {
    children: ReactNode;
}

const SupervisorLayout = ({ children }: SupervisorLayoutProps) => {
    return (
        <Layout>
            {children}
        </Layout>
    );
};

export default SupervisorLayout;
