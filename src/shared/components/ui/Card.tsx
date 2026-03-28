import { ReactNode } from 'react';

export interface CardProps {
    children: ReactNode;
    className?: string;
    padding?: string;
    hover?: boolean;
    header?: ReactNode;
    footer?: ReactNode;
    onClick?: () => void;
}

export const Card = ({
    children,
    className = '',
    padding = 'p-6',
    hover = false,
    header,
    footer,
    onClick
}: CardProps) => {
    return (
        <div 
            onClick={onClick}
            className={`
                bg-white rounded-xl border border-gray-100 shadow-sm
                ${hover ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-1' : ''}
                ${onClick ? 'cursor-pointer' : ''}
                ${className}
            `}
        >
            {header && (
                <div className={`border-b border-gray-100 ${padding}`}>
                    {header}
                </div>
            )}

            <div className={`${padding}`}>
                {children}
            </div>

            {footer && (
                <div className={`border-t border-gray-100 bg-gray-50 rounded-b-xl ${padding}`}>
                    {footer}
                </div>
            )}
        </div>
    );
};

export default Card;
