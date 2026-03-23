import React from 'react';

const colorMap: Record<string, { bg: string; icon: string; accent: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', accent: 'border-blue-200' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', accent: 'border-green-200' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', accent: 'border-amber-200' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', accent: 'border-purple-200' },
};

export interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
}

export const StatCard = ({ icon, label, value, color }: StatCardProps) => {
    const c = colorMap[color] || colorMap.blue;
    return (
        <div className={`bg-white rounded-xl border ${c.accent} p-5 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-3">
                <div className={`${c.bg} p-2.5 rounded-lg`}>
                    <div className={c.icon}>{icon}</div>
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
