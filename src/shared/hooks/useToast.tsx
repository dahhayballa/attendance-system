import { useState, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

type Listener = (toasts: ToastMessage[]) => void;

const listeners = new Set<Listener>();
let toasts: ToastMessage[] = [];

export const toast = {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
    warning: (message: string) => addToast(message, 'warning'),
};

const addToast = (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, message, type }];
    listeners.forEach(listener => listener([...toasts]));
    setTimeout(() => removeToast(id), 3000);
};

const removeToast = (id: string) => {
    toasts = toasts.filter(t => t.id !== id);
    listeners.forEach(listener => listener([...toasts]));
};

export const useToast = () => {
    return { toast };
};

export const ToastContainer = () => {
    const [activeToasts, setActiveToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const handleToasts = (newToasts: ToastMessage[]) => setActiveToasts(newToasts);
        listeners.add(handleToasts);

        // Set initial state
        setActiveToasts([...toasts]);

        return () => {
            listeners.delete(handleToasts);
        };
    }, []);

    if (activeToasts.length === 0) return null;

    const bgColors: Record<ToastType, string> = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
        warning: 'bg-yellow-600'
    };

    return (
        <div className= "fixed bottom-4 left-4 z-50 flex flex-col gap-2" >
        {
            activeToasts.map(t => (
                <div key= { t.id } className = {`${bgColors[t.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-[250px] transition-all`} >
        <span className="font-medium text-sm ml-4" > { t.message } </span>
            < button onClick = {() => removeToast(t.id)} className = "text-white/80 hover:text-white mr-auto focus:outline-none" >
              ✕
</button>
    </div>
        ))}
</div>
    );
};
