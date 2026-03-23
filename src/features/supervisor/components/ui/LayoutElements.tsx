import React from 'react';

export const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-blue-500 rounded-full" />
        <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
    </div>
);

export const Divider = () => (
    <div className="relative">
        <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
            <span className="bg-gray-50 px-3">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
            </span>
        </div>
    </div>
);
