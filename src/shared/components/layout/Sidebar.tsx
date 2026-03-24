import { NavLink, useLocation } from 'react-router-dom';
import {
    Home, Clock, ClipboardList, BarChart3, Settings,
    LayoutDashboard, Activity, Shield, FileText,
    X, ChevronRight, LogOut
} from 'lucide-react';
import { useAuth } from '../../../features/auth/hooks/useAuth';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const SUPERVISOR_NAV = [
    {
        section: 'Pointage',
        items: [
            { id: 'home',       label: 'Accueil',         icon: Home,          path: '/supervisor'                    },
            { id: 'now',        label: 'Séance en cours', icon: Clock,         path: '/supervisor/now'                },
            { id: 'attendance', label: 'Enregistrement',  icon: ClipboardList, path: '/supervisor/attendance'         },
        ]
    },
    {
        section: 'Analyse',
        items: [
            { id: 'records',    label: 'Historique',      icon: FileText,      path: '/supervisor/attendance/records'  },
            { id: 'statistics', label: 'Statistiques',    icon: BarChart3,     path: '/supervisor/statistics'         },
        ]
    },
    {
        section: 'Système',
        items: [
            { id: 'settings',   label: 'Paramètres',      icon: Settings,      path: '/supervisor/settings'           },
        ]
    },
];

const ADMIN_NAV = [
    {
        section: 'Administration',
        items: [
            { id: 'dashboard',   label: 'Tableau de bord', icon: LayoutDashboard, path: '/admin'              },
            { id: 'live',        label: 'Suivi en direct', icon: Activity,        path: '/admin/live'         },
        ]
    },
    {
        section: 'Gestion',
        items: [
            { id: 'supervisors', label: 'Superviseurs',    icon: Shield,          path: '/admin/supervisors'  },
            { id: 'reports',     label: 'Rapports',        icon: FileText,        path: '/admin/reports'      },
        ]
    },
];

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { userRole, logout, user } = useAuth();
    const location = useLocation();

    const nav = userRole === 'admin' ? ADMIN_NAV : SUPERVISOR_NAV;

    const isActive = (path: string) => {
        if (path === '/supervisor' || path === '/admin') {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {/* Mobile backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-200 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-64
                    bg-white border-r border-gray-100
                    flex flex-col shadow-xl
                    transform transition-transform duration-300 ease-in-out
                    lg:translate-x-0 lg:static lg:shadow-none
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* ── Logo ── */}
                <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-700 rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-white font-black text-sm">MPG</span>
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm leading-none">EETFP-MPG</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Système de présence</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── User info card ── */}
                <div className="mx-3 mt-4 px-3 py-3 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-green-700 font-bold text-xs">
                                {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">
                                {user?.name || user?.email?.split('@')[0]}
                            </p>
                            <p className="text-[10px] text-green-600 font-medium uppercase tracking-wide">
                                {userRole === 'admin' ? 'Administrateur' : 'Superviseur'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Navigation ── */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                    {nav.map((group) => (
                        <div key={group.section}>
                            {/* Section title */}
                            <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {group.section}
                            </p>

                            {/* Items */}
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const active = isActive(item.path);
                                    return (
                                        <NavLink
                                            key={item.id}
                                            to={item.path}
                                            onClick={() => {
                                                if (window.innerWidth < 1024) onClose();
                                            }}
                                            className={`
                                                flex items-center gap-3 px-3 py-2.5 rounded-xl
                                                transition-all duration-150 group
                                                ${active
                                                    ? 'bg-green-50 text-green-800'
                                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                                }
                                            `}
                                        >
                                            {/* Icon box */}
                                            <div className={`
                                                w-8 h-8 rounded-lg flex items-center justify-center
                                                flex-shrink-0 transition-colors
                                                ${active
                                                    ? 'bg-green-700 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600'
                                                }
                                            `}>
                                                <item.icon size={16} />
                                            </div>

                                            {/* Label */}
                                            <span className={`flex-1 text-sm ${active ? 'font-semibold' : 'font-medium'}`}>
                                                {item.label}
                                            </span>

                                            {/* Active arrow */}
                                            {active && (
                                                <ChevronRight size={14} className="text-green-500 flex-shrink-0" />
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* ── Logout ── */}
                <div className="p-3 border-t border-gray-100 flex-shrink-0">
                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                                text-gray-500 hover:text-red-600 hover:bg-red-50
                                transition-all duration-150 group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-red-100
                                        flex items-center justify-center flex-shrink-0 transition-colors">
                            <LogOut size={15} className="group-hover:text-red-500" />
                        </div>
                        <span>Déconnexion</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;