import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string | null;
    helperText?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    className = '',
    id,
    ...props
}, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    return (
        <div className="flex flex-col gap-1 w-full">
            {label && (
                <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <div className="relative flex items-center">
                {rightIcon && (
                    <span className="absolute right-3 text-gray-400 flex items-center justify-center">
                        {rightIcon}
                    </span>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`
            w-full rounded-lg border bg-white px-4 py-2 text-gray-900
            transition-all duration-200 outline-none
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
            ${rightIcon ? 'pr-10' : ''}
            ${leftIcon ? 'pl-10' : ''}
            ${className}
          `}
                    {...props}
                />
                {leftIcon && (
                    <span className="absolute left-3 text-gray-400 flex items-center justify-center">
                        {leftIcon}
                    </span>
                )}
            </div>
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
