import React from 'react';

export interface InfoRowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    highlight?: boolean;
    accent?: 'green' | 'amber' | 'red';
}

export const InfoRow = ({ icon, label, value, highlight, accent }: InfoRowProps) => {
    const accentColors = {
        green: 'text-green-600 bg-green-50 px-2 py-0.5 rounded-md',
        amber: 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md',
        red: 'text-red-600 bg-red-50 px-2 py-0.5 rounded-md',
    };

    return (
        <div className="flex items-center gap-3">
            <div className="text-gray-400 shrink-0">{icon}</div>
            <span className="text-xs text-gray-500 w-14 shrink-0">{label}</span>
            <span className={`text-sm ${accent ? accentColors[accent] :
                highlight ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                }`}>
                {value}
            </span>
        </div>
    );
};

export default InfoRow;
