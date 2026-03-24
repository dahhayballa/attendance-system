import { useState, useRef, useEffect } from 'react';
import { realtimeService, Notification } from '../../../services/supabase/realtime.service';
import { useToast } from '../../hooks/useToast';
import { Bell } from 'lucide-react';

export const NotificationBell = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const loadNotifs = async () => {
            try {
                const notifs = await realtimeService.getRecentNotifications(15);
                setNotifications(notifs);
            } catch (error) {
                console.error('Failed to load notifications');
            }
        };

        loadNotifs();

        const notifSub = realtimeService.subscribeToNotifications((newNotif) => {
            setNotifications(prev => [newNotif, ...prev].slice(0, 20));
            // Show toast visually
            if (newNotif.type === 'absent') {
                toast.error(newNotif.message);
                const audio = new Audio('/notification-sound.mp3');
                audio.play().catch(e => console.log('Audio play failed', e));
            } else if (newNotif.type === 'late') {
                toast.warning(newNotif.message);
            } else {
                toast.info(newNotif.message);
            }
        });

        return () => {
            notifSub?.unsubscribe();
        };
    }, []);

    const markAsRead = async (id: string, currentlyRead: boolean) => {
        if (currentlyRead) return;
        try {
            await realtimeService.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (e) { }
    };

    const markAllAsRead = async () => {
        try {
            await Promise.all(notifications.filter(n => !n.read).map(n => realtimeService.markNotificationRead(n.id)));
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (e) { }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-2xl transition-all duration-300 ring-4 ring-transparent hover:ring-orange-50 ${isOpen ? 'bg-orange-50 text-orange-600' : 'bg-gray-50/50 text-gray-400 hover:text-orange-500 hover:bg-white border border-gray-100'}`}
                title="Notifications"
            >
                <Bell size={20} className={unreadCount > 0 ? 'animate-wiggle' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full mt-3 end-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Bell size={16} className="text-orange-500" />
                            Alertes instantanées
                        </h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead} 
                                className="text-[10px] font-bold uppercase tracking-wider text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 py-1 rounded-md transition-colors"
                            >
                                Tout marquer lu
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                                <div className="p-3 bg-gray-50 rounded-full text-gray-300">
                                    <Bell size={24} />
                                </div>
                                <p className="text-sm text-gray-400 font-medium">Aucune alerte pour le moment</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => markAsRead(n.id, n.read)}
                                    className={`p-3 rounded-xl border-l-4 cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                                        n.type === 'absent' ? 'border-red-500 hover:bg-red-50' :
                                        n.type === 'late' ? 'border-amber-500 hover:bg-amber-50' :
                                        'border-blue-500 hover:bg-blue-50'
                                    } ${!n.read ? 'bg-gray-50/50 opacity-100' : 'bg-transparent opacity-60 grayscale-[30%]'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold text-sm ${
                                            n.type === 'absent' ? 'text-red-700' :
                                            n.type === 'late' ? 'text-amber-700' :
                                            'text-blue-700'
                                        }`}>{n.title}</h4>
                                        <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-2">
                                            {new Date(n.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 font-medium leading-relaxed">{n.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <div className="p-2 border-t border-gray-100 mt-1">
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
