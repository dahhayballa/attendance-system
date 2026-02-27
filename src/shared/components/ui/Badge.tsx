import { ReactNode } from 'react';

export interface BadgeProps {
    children: ReactNode;
    variant?: 'info' | 'success' | 'warning' | 'danger' | 'primary' | 'pending' | 'present' | 'absent';
    className?: string;
}

export const Badge = ({ children, variant = 'info', className = '' }: BadgeProps) => {
    const variants: Record<string, string> = {
        info: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        primary: 'bg-blue-100 text-blue-800',
        pending: 'bg-yellow-100 text-yellow-800',
        present: 'bg-green-100 text-green-800',
        absent: 'bg-red-100 text-red-800'
    };

    return (
        <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${variants[variant]}
      ${className}
    `}>
            {children}
        </span>
    );
};

export default Badge;
