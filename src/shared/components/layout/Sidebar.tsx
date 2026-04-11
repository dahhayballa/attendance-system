import { NavLink, useLocation } from 'react-router-dom';
import {
    Home, BarChart3, Settings,
    LayoutDashboard, Activity, Shield, FileText,
    X, ChevronRight, History, Calendar, Users
} from 'lucide-react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface SidebarProps { isOpen: boolean; onClose: () => void; }

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { userRole } = useAuth();
    const location = useLocation();
    const { t } = useTranslation();

    const SUPERVISOR_NAV = [
        { section: t('common.navNavigation'), items: [
            { id: 'home',       label: t('supervisor.sidebar.home'),         icon: Home,          path: '/supervisor'                   },
            { id: 'now',        label: t('supervisor.sidebar.now'),          icon: Activity,      path: '/supervisor/now'               },
            { id: 'history',    label: t('supervisor.sidebar.history'), icon: History,      path: '/supervisor/history'           },
        ]},
        { section: t('common.navAnalysis'), items: [
            { id: 'timetable',  label: t('supervisor.sidebar.timetable'),        icon: Calendar,      path: '/supervisor/timetable' },
            { id: 'statistics', label: t('supervisor.sidebar.statistics'),    icon: BarChart3,     path: '/supervisor/statistics'        },
        ]},
        { section: t('common.navSystem'), items: [
            { id: 'settings',   label: t('supervisor.sidebar.settings'),      icon: Settings,      path: '/supervisor/settings'          },
        ]},
    ];

    const ADMIN_NAV = [
        { section: t('common.navDashboard'), items: [
            { id: 'dashboard',   label: t('admin.sidebar.dashboard'),    icon: LayoutDashboard, path: '/admin'            },
            { id: 'live',        label: t('admin.sidebar.liveDashboard'),    icon: Activity,        path: '/admin/live'       },
            { id: 'daily',       label: t('admin.sidebar.daily'),               icon: Calendar,        path: '/admin/daily'      },
        ]},
        { section: t('common.navManagement'), items: [
            { id: 'supervisors', label: t('admin.sidebar.supervisors'),        icon: Shield,          path: '/admin/supervisors'},
            { id: 'users',       label: t('admin.sidebar.users'),              icon: Users,           path: '/admin/users'},
            { id: 'reports',     label: t('admin.sidebar.reports'),            icon: FileText,        path: '/admin/reports'   },
            { id: 'logs',        label: t('admin.sidebar.logs', 'Registre d\'Audit'), icon: History,         path: '/admin/logs'      },
            { id: 'statistics',  label: t('admin.sidebar.statistics'),         icon: BarChart3,       path: '/admin/statistics' },
            { id: 'weeks',       label: t('admin.sidebar.weeks', 'Gestion Semaines'), icon: Calendar,    path: '/admin/weeks' },
        ]},
    ];

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
                className={`
                    fixed inset-y-0 ltr:left-0 rtl:right-0 z-50 w-64 flex flex-col bg-white
                    transform transition-transform duration-300 ease-in-out ltr:border-r rtl:border-l border-gray-100
                    lg:!translate-x-0 lg:static
                    ${isOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'}
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
                            <p className="text-xs mt-0.5 font-medium text-orange-600">{t('common.systemSubtitle')}</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="lg:hidden p-1.5 rounded-lg transition-colors text-gray-400 hover:text-gray-900 hover:bg-gray-100">
                        <X size={17} />
                    </button>
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
                                            {active && <ChevronRight size={13} className="text-orange-500 rtl:rotate-180" />}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

            </aside>
        </>
    );
};

export default Sidebar;