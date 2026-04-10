import React from 'react';
import Card from '../../../shared/components/ui/Card';

const ACCENT_MAP: Record<string, string> = {
  orange: 'bg-orange-50 text-orange-500',
  green:  'bg-emerald-50 text-emerald-500',
  red:    'bg-rose-50 text-rose-500',
  amber:  'bg-amber-50 text-amber-500',
  blue:   'bg-blue-50 text-blue-500',
  gray:   'bg-gray-50 text-gray-400'
};

export const StatCard = ({
  title, value, icon, accent, className = '',
}: { title: string; value: string | number; icon: React.ReactNode; accent: string; className?: string }) => {
  const variant = ACCENT_MAP[accent] || ACCENT_MAP.gray;
  return (
    <Card 
        hover
        className={`border-gray-100 flex flex-col items-center justify-center text-center h-24 relative group ${className}`} 
        padding="p-4"
    >
        <div className={`p-2 rounded-lg ${variant} mb-2`}>
            {icon}
        </div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-sm font-black text-gray-950 mt-0.5">{value}</p>
    </Card>
  );
};
