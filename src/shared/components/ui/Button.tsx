import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    fullWidth?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    onClick,
    type = 'button',
    className = '',
    ...props
}, ref) => {
    const { t } = useTranslation();
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white border border-transparent',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-transparent',
        success: 'bg-green-600 hover:bg-green-700 text-white border border-transparent',
        danger: 'bg-red-600 hover:bg-red-700 text-white border border-transparent',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border border-transparent'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    const buttonClass = `
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    font-semibold rounded-lg
    transition-all duration-200
    flex items-center justify-center gap-2
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    ${className}
  `.trim().replace(/\s+/g, ' ');

    return (
        <button
            ref={ref}
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={buttonClass}
            {...props}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{t('button.loading')}</span>
                </>
            ) : (
                <>
                    {rightIcon && <span>{rightIcon}</span>}
                    {children}
                    {leftIcon && <span>{leftIcon}</span>}
                </>
            )}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
