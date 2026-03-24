import { NavLink, useLocation } from 'react-router-dom';
import {
    Home, ClipboardList, BarChart3, Settings,
    LayoutDashboard, Activity, Shield, FileText,
    X, ChevronRight, LogOut
} from 'lucide-react';
import { useAuth } from '../../../features/auth/hooks/useAuth';

interface SidebarProps { isOpen: boolean; onClose: () => void; }

const SUPERVISOR_NAV = [
    { section: 'NAVIGATION', items: [
        { id: 'home',       label: 'Accueil',         icon: Home,          path: '/supervisor'                   },
        { id: 'attendance', label: 'Enregistrement',  icon: ClipboardList, path: '/supervisor/attendance'        },
    ]},
    { section: 'ANALYSE', items: [
        { id: 'records',    label: 'Historique',      icon: FileText,      path: '/supervisor/attendance/records' },
        { id: 'statistics', label: 'Statistiques',    icon: BarChart3,     path: '/supervisor/statistics'        },
    ]},
    { section: 'SYSTÈME', items: [
        { id: 'settings',   label: 'Paramètres',      icon: Settings,      path: '/supervisor/settings'          },
    ]},
];

const ADMIN_NAV = [
    { section: 'TABLEAU DE BORD', items: [
        { id: 'dashboard',   label: 'Vue d\'ensemble',    icon: LayoutDashboard, path: '/admin'            },
        { id: 'live',        label: 'Suivi en direct',    icon: Activity,        path: '/admin/live'       },
    ]},
    { section: 'GESTION', items: [
        { id: 'supervisors', label: 'Superviseurs',        icon: Shield,          path: '/admin/supervisors'},
        { id: 'reports',     label: 'Rapports',            icon: FileText,        path: '/admin/reports'   },
    ]},
];

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { userRole, logout, user } = useAuth();
    const location = useLocation();
    const nav = userRole === 'admin' ? ADMIN_NAV : SUPERVISOR_NAV;

    const isActive = (path: string) => {
        if (path === '/supervisor' || path === '/admin') return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
                onClick={onClose}
            />
            <aside
                dir="ltr"
                className={`
                    fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white
                    transform transition-transform duration-300 ease-in-out border-r border-gray-100
                    lg:translate-x-0 lg:static
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
                style={{
                    boxShadow: isOpen ? '4px 0 24px rgba(0,0,0,0.1)' : 'none',
                }}
            >
                {/* ── Logo ── */}
                <div className="flex items-center justify-between px-5 h-20 flex-shrink-0 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-orange-50 border border-orange-100">
                            <img src="/logo-mpg.png" alt="MPG" className="w-10 h-10 object-contain"
                                onError={e => {
                                    const el = e.currentTarget;
                                    el.style.display = 'none';
                                    el.parentElement!.innerHTML = '<span style="color:#f97316;font-weight:900;font-size:14px">MPG</span>';
                                }}
                            />
                        </div>
                        <div>
                            <p className="font-black text-base leading-none text-gray-900">EETFP-MPG</p>
                            <p className="text-xs mt-0.5 font-medium text-orange-600">Système de présence</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="lg:hidden p-1.5 rounded-lg transition-colors text-gray-400 hover:text-gray-900 hover:bg-gray-100">
                        <X size={17} />
                    </button>
                </div>

                {/* ── User card ── */}
                <div className="mx-3 mt-4 px-3 py-3 rounded-xl flex-shrink-0 bg-orange-50 border border-orange-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm">
                            {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold truncate text-gray-900">
                                {user?.name || user?.email?.split('@')[0]}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 text-orange-600">
                                {userRole === 'admin' ? 'Administrateur' : 'Superviseur'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Navigation ── */}
                <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
                    {nav.map((group) => (
                        <div key={group.section}>
                            <p className="px-3 mb-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                                {group.section}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const active = isActive(item.path);
                                    return (
                                        <NavLink key={item.id} to={item.path}
                                            onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group border ${
                                                active ? 'bg-orange-50 border-orange-100 text-orange-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                                                active ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600'
                                            }`}>
                                                <item.icon size={15} />
                                            </div>
                                            <span className={`flex-1 text-sm ${active ? 'font-bold' : 'font-medium'}`}>
                                                {item.label}
                                            </span>
                                            {active && <ChevronRight size={13} className="text-orange-500" />}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* ── Logout ── */}
                <div className="p-3 flex-shrink-0 border-t border-gray-100">
                    <button onClick={() => logout()}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 border border-transparent hover:bg-red-50 hover:text-red-700 hover:border-red-100 text-gray-500 group">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-100 group-hover:bg-red-100 transition-colors">
                            <LogOut size={15} className="text-gray-400 group-hover:text-red-600" />
                        </div>
                        <span className="text-sm font-medium">
                            Déconnexion
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;