import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    Home, 
    BarChart3, 
    FileText, 
    Settings, 
    Activity, 
    Shield, 
    Clock,
    LayoutDashboard,
    ClipboardList,
    X,
    ChevronRight,
    ChevronDown,
    CheckSquare,
    List,
    Users as UsersIcon,
    CalendarDays,
    UserMinus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../features/auth/hooks/useAuth';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { userRole } = useAuth();
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['attendance']);

    const isRTL = i18n.language === 'ar';

    const toggleMenu = (id: string) => {
        setExpandedMenus(prev => 
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const adminItems = [
        { id: 'admin-dashboard', label: 'Admin Dashboard', icon: LayoutDashboard, path: '/admin' },
        { id: 'live-dashboard', label: 'Live Dashboard', icon: Activity, path: '/admin/live' },
        { id: 'supervisors', label: 'Supervisors', icon: Shield, path: '/admin/supervisors' },
        { id: 'admin-reports', label: 'Reports', icon: FileText, path: '/admin/reports' },
    ];

    const supervisorItems = [
        { id: 'dashboard', label: t('supervisor.sidebar.home'), icon: Home, path: '/supervisor' },
        { id: 'now', label: 'الآن', icon: Clock, path: '/supervisor/now' },
        { 
            id: 'attendance',
            label: t('supervisor.sidebar.attendance'), 
            icon: ClipboardList, 
            path: '/supervisor/attendance',
            subItems: [
                { id: 'att-record', label: t('supervisor.sidebar.attendanceRecord'), icon: CheckSquare, path: '/supervisor/attendance' },
                { id: 'att-records', label: t('supervisor.sidebar.attendanceRecords'), icon: List, path: '/supervisor/attendance/records' },
                { id: 'att-teachers', label: t('supervisor.sidebar.attendanceTeachers'), icon: UsersIcon, path: '/supervisor/attendance/teachers' },
                { id: 'att-calendar', label: t('supervisor.sidebar.attendanceCalendar'), icon: CalendarDays, path: '/supervisor/attendance/calendar' },
                { id: 'att-absent', label: t('supervisor.sidebar.attendanceAbsent'), icon: UserMinus, path: '/supervisor/attendance/absent' },
            ]
        },
        { id: 'statistics', label: t('supervisor.sidebar.statistics'), icon: BarChart3, path: '/supervisor/statistics' },
        { id: 'reports', label: t('supervisor.sidebar.reports'), icon: FileText, path: '/supervisor/reports' },
        { id: 'settings', label: t('supervisor.sidebar.settings'), icon: Settings, path: '/supervisor/settings' },
    ];

    const navItems = userRole === 'admin' ? adminItems : supervisorItems;

    return (
        <>
            {/* Backdrop for mobile */}
            <div 
                className={`fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            {/* Sidebar container */}
            <aside 
                className={`fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-50 w-72 bg-white border-${isRTL ? 'l' : 'r'} border-gray-100 flex flex-col shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static ${isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'}`}
            >
                {/* Header/Branding */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-gray-50 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/logo-mpg.png" 
                            alt="MPG Logo" 
                            className="w-10 h-10 object-contain drop-shadow-sm" 
                        />
                        <div className="flex flex-col">
                            <span className="font-black text-xl text-gray-900 leading-none tracking-tight">
                                MPG
                            </span>
                            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1 opacity-80">EETFP Attendance</span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="lg:hidden p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="px-3 mb-6">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('common.mainMenu') || 'Main Menu'}</p>
                    </div>
                    {navItems.map((item: any) => {
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isExpanded = expandedMenus.includes(item.id);
                        const isMainActive = location.pathname === item.path || (hasSubItems && item.subItems.some((s: any) => location.pathname === s.path));

                        return (
                            <div key={item.id} className="space-y-1">
                                {hasSubItems ? (
                                    <button
                                        onClick={() => toggleMenu(item.id)}
                                        className={`
                                            w-full group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300
                                            ${isMainActive 
                                                ? 'bg-blue-50/80 text-blue-700 font-bold' 
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                                        `}
                                    >
                                        <item.icon size={20} className={`shrink-0 ${isMainActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500 transition-colors'}`} />
                                        <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold`}>{item.label}</span>
                                        <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`} />
                                    </button>
                                ) : (
                                    <NavLink
                                        to={item.path}
                                        end
                                        onClick={() => {
                                            if (window.innerWidth < 1024) onClose();
                                        }}
                                        className={({ isActive }) => `
                                            group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300
                                            ${isActive 
                                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-[1.02] z-10' 
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                                        `}
                                    >
                                        <item.icon size={20} className={`shrink-0 transition-transform duration-300 ${isMainActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                        <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'} text-sm font-semibold`}>{item.label}</span>
                                        {!isRTL && <ChevronRight size={14} className={`opacity-0 group-hover:opacity-40 transition-all transform translate-x-2 group-hover:translate-x-0`} />}
                                    </NavLink>
                                )}

                                {hasSubItems && isExpanded && (
                                    <div className={`${isRTL ? 'mr-10' : 'ml-10'} space-y-1 mt-2 animate-in slide-in-from-top-4 duration-300`}>
                                        {item.subItems.map((sub: any) => {
                                            const SubIcon = sub.icon;
                                            return (
                                                <NavLink
                                                    key={sub.id}
                                                    to={sub.path}
                                                    end
                                                    onClick={() => {
                                                        if (window.innerWidth < 1024) onClose();
                                                    }}
                                                    className={({ isActive }) => `
                                                        flex items-center gap-3 px-4 py-3 rounded-xl text-xs transition-all duration-300
                                                        ${isActive 
                                                            ? `text-blue-700 font-black bg-blue-50/50 relative before:absolute before:${isRTL ? 'right-0' : 'left-0'} before:top-1/4 before:bottom-1/4 before:w-1 before:bg-blue-600 before:rounded-full` 
                                                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}
                                                    `}
                                                >
                                                    {({ isActive }) => (
                                                        <>
                                                            <SubIcon size={16} className={`shrink-0 ${isActive ? 'text-blue-600' : 'opacity-40'}`} />
                                                            <span className="flex-1">{sub.label}</span>
                                                        </>
                                                    )}
                                                </NavLink>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
