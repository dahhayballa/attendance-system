import React from 'react';
import { getStatusColors, StatusType } from '../../../../shared/styles/colors';
import { CheckCircle, XCircle, AlertTriangle, FileText, Clock } from 'lucide-react';

interface StatusBadgeProps {
    status: StatusType | string;
    label?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const statusIcons: Record<string, React.ElementType> = {
    present: CheckCircle,
    absent: XCircle,
    late: AlertTriangle,
    excused: FileText,
    pending: Clock,
};

const defaultLabels: Record<string, string> = {
    present: 'حاضر',
    absent: 'غائب',
    late: 'متأخر',
    excused: 'ملاحظة',
    pending: 'قيد الانتظار',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    label,
    className = '',
    size = 'md'
}) => {
    const colors = getStatusColors(status);
    const Icon = statusIcons[status as string] || statusIcons.pending;
    const displayLabel = label || defaultLabels[status as string] || status;

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs gap-1',
        md: 'px-2.5 py-1 text-sm gap-1.5',
        lg: 'px-3 py-1.5 text-base gap-2',
    };

    const iconSizes = {
        sm: 14,
        md: 16,
        lg: 18,
    };

    return (
        <span className={`inline-flex items-center font-medium rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]} ${className}`}>
            <Icon size={iconSizes[size]} className={colors.icon} />
            {displayLabel}
        </span>
    );
};

export default StatusBadge;
