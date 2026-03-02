import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ErrorMessageProps {
    title?: string;
    message?: string | null;
    onRetry?: () => void;
}

export const ErrorMessage = ({ title, message, onRetry }: ErrorMessageProps) => {
    const { t } = useTranslation();
    const resolvedTitle = title ?? t('error.defaultTitle');
    return (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 w-full">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">{resolvedTitle}</h3>
                    {message && (
                        <div className="mt-1 text-sm text-red-700 whitespace-pre-wrap">
                            {message}
                        </div>
                    )}
                    {onRetry && (
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={onRetry}
                                className="text-sm font-medium text-red-700 hover:text-red-800 underline focus:outline-none"
                            >
                                {t('error.retry')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ErrorMessage;
