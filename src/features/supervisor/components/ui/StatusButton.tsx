import React from 'react';
import { RefreshCw } from 'lucide-react';
import { getStatusColors, StatusType } from '../../../../shared/styles/colors';

export interface StatusButtonProps {
    icon: React.ReactNode;
    label: string;
    status: StatusType;
    onClick: () => void;
    loading?: boolean;
}

export const StatusButton = ({ icon, label, status, onClick, loading }: StatusButtonProps) => {
    const colors = getStatusColors(status);

    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-sm font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${colors.bg} ${colors.text} ${colors.border} ${colors.hoverBg} ${colors.hoverBorder}`}
        >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
};

export default StatusButton;
