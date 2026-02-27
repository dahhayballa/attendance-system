import { ReactNode } from 'react';
import Card from '../../../shared/components/ui/Card';

export interface StatsCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    variant?: 'total' | 'success' | 'warning' | 'info';
    trend?: number;
}

export const StatsCard = ({ title, value, icon, variant = 'info', trend }: StatsCardProps) => {
    const colors: Record<string, string> = {
        total: 'bg-blue-50 text-blue-600 border-blue-100',
        success: 'bg-green-50 text-green-600 border-green-100',
        warning: 'bg-yellow-50 text-yellow-600 border-yellow-100',
        info: 'bg-gray-50 text-gray-600 border-gray-100'
    };

    const currentColors = colors[variant] || colors.info;

    return (
        <Card hover className="h-full">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                        {trend !== undefined && (
                            <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                            </span>
                        )}
                    </div>
                </div>
                <div className={`p-3 rounded-lg border ${currentColors}`}>
                    {icon}
                </div>
            </div>
        </Card>
    );
};

export default StatsCard;
