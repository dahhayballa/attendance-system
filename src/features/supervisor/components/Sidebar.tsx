import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Home, BarChart3, FileText, Settings, ChevronRight, ClipboardList,
    CheckSquare, List, Users, CalendarDays, UserMinus, ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [expandedMenu, setExpandedMenu] = useState<string | null>('attendance');

    const navItems = [
        { id: 'dashboard', label: t('supervisor.sidebar.home'), icon: Home, path: '/supervisor' },
        {
            id: 'attendance', label: t('supervisor.sidebar.attendance'), icon: ClipboardList, path: '/supervisor/attendance',
            subItems: [
                { id: 'att-record', label: t('supervisor.sidebar.attendanceRecord'), icon: CheckSquare, path: '/supervisor/attendance' },
                { id: 'att-records', label: t('supervisor.sidebar.attendanceRecords'), icon: List, path: '/supervisor/attendance/records' },
                { id: 'att-teachers', label: t('supervisor.sidebar.attendanceTeachers'), icon: Users, path: '/supervisor/attendance/teachers' },
                { id: 'att-calendar', label: t('supervisor.sidebar.attendanceCalendar'), icon: CalendarDays, path: '/supervisor/attendance/calendar' },
                { id: 'att-absent', label: t('supervisor.sidebar.attendanceAbsent'), icon: UserMinus, path: '/supervisor/attendance/absent' },
            ]
        },
        { id: 'statistics', label: t('supervisor.sidebar.statistics'), icon: BarChart3, path: '/supervisor/statistics' },
        { id: 'reports', label: t('supervisor.sidebar.reports'), icon: FileText, path: '/supervisor/reports' },
        { id: 'settings', label: t('supervisor.sidebar.settings'), icon: Settings, path: '/supervisor/settings' },
    ];

    const handleNavigate = (path: string, hasSubItems: boolean) => {
        if (!hasSubItems) {
            navigate(path);
            onClose(); // Fermer la sidebar sur mobile
        }
    };

    const toggleMenu = (id: string) => {
        setExpandedMenu(expandedMenu === id ? null : id);
    };

    const isActive = (path: string, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {/* Backdrop mobile */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-16 bottom-0 right-0 z-50
                    w-64 bg-white border-l border-gray-200
                    transform transition-transform duration-300 ease-in-out
                    lg:translate-x-0 lg:static lg:z-auto flex flex-col shadow-lg lg:shadow-none
                    ${open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isMenuExpanded = expandedMenu === item.id;
                        const hasSub = !!item.subItems;
                        // For main items with subItems, check if any subItem is active
                        const active = hasSub
                            ? isActive(item.path)
                            : isActive(item.path, item.path === '/supervisor');
                        const Icon = item.icon;

                        return (
                            <div key={item.id} className="space-y-1">
                                <button
                                    onClick={() => {
                                        if (hasSub) toggleMenu(item.id);
                                        else handleNavigate(item.path, false);
                                    }}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 rounded-xl
                                        text-sm font-medium transition-all duration-200
                                        ${active && !hasSub
                                            ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                                            : active && hasSub
                                                ? 'bg-gray-50 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }
                                    `}
                                >
                                    <Icon
                                        size={20}
                                        className={`shrink-0 transition-colors ${active ? 'text-blue-600' : 'text-gray-400'}`}
                                    />
                                    <span className="flex-1 text-right">{item.label}</span>

                                    {/* Arrow for sub-menu */}
                                    {hasSub && (
                                        <ChevronDown
                                            size={16}
                                            className={`transition-transform duration-200 ${isMenuExpanded ? 'rotate-180 text-blue-600' : 'text-gray-400'}`}
                                        />
                                    )}
                                    {/* Active indicator for simple items */}
                                    {!hasSub && active && (
                                        <ChevronRight size={16} className="text-blue-400" />
                                    )}
                                </button>

                                {/* Sub Items */}
                                {hasSub && isMenuExpanded && (
                                    <div className="pl-4 pr-11 space-y-1 mt-1 animate-in slide-in-from-top-2 fade-in duration-200">
                                        {item.subItems!.map((sub) => {
                                            const subActive = location.pathname === sub.path;
                                            const SubIcon = sub.icon;
                                            return (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => handleNavigate(sub.path, false)}
                                                    className={`
                                                        w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                                                        text-xs font-medium transition-all
                                                        ${subActive
                                                            ? 'bg-blue-50 text-blue-700 font-bold'
                                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                                        }
                                                    `}
                                                >
                                                    <SubIcon size={14} className={subActive ? 'text-blue-500' : 'text-gray-400'} />
                                                    <span className="flex-1 text-right">{sub.label}</span>
                                                    {subActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100">
                    <div className="text-center">
                        <p className="text-xs text-gray-400">{t('supervisor.sidebar.footerTitle')}</p>
                        <p className="text-[10px] text-gray-300 mt-0.5">{t('supervisor.sidebar.footerVersion')}</p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
