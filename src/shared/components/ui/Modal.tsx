import React from 'react';
import {  XCircle } from 'lucide-react';

export interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

export const Modal = ({ title, onClose, children }: ModalProps) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">{title}</h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <XCircle size={18} className="text-gray-400" />
                </button>
            </div>
            {children}
        </div>
    </div>
);

export default Modal;
