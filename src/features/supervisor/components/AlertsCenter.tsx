import { useState } from 'react';
import { useAlerts, type Alert, type AlertSettings } from '../hooks/useAlerts';
import { useAuth } from '../../auth/hooks/useAuth';
import { recordAttendance } from '../services/attendanceService';
import { useToast } from '../../../shared/hooks/useToast';
import {
    Bell, Settings, X,
    AlertTriangle, Info, Clock, BellOff,
    RefreshCw, ChevronDown, Eye
} from 'lucide-react';

/* ═══════════ Constants ═══════════ */

const TYPE_CONFIG = {
    critical: {
        icon: <AlertTriangle size={16} />,
        dot: 'bg-red-500',
        bg: 'bg-red-50 border-red-200',
        title: 'text-red-800',
        label: '🔴 عاجل',
    },
    warning: {
        icon: <Clock size={16} />,
        dot: 'bg-amber-500',
        bg: 'bg-amber-50 border-amber-200',
        title: 'text-amber-800',
        label: '🟡 تنبيه',
    },
    info: {
        icon: <Info size={16} />,
        dot: 'bg-green-500',
        bg: 'bg-green-50 border-green-200',
        title: 'text-green-800',
        label: '🟢 معلومة',
    },
    history: {
        icon: <Clock size={16} />,
        dot: 'bg-gray-400',
        bg: 'bg-gray-50 border-gray-200',
        title: 'text-gray-600',
        label: '⚪ سجل',
    },
};

/* ═══════════ Component ═══════════ */

interface AlertsCenterProps {
    className?: string;
    onTeacherFilter?: (teacher: string) => void;
}

const AlertsCenter = ({ className = '', onTeacherFilter }: AlertsCenterProps) => {
    const {
        alerts, unreadCount, loading, settings, saveSettings,
        markAsRead, dismissAlert, dismissAll, refetch, requestDesktopPermission
    } = useAlerts();
    const { user } = useAuth();
    const { toast } = useToast();
    const [showSettings, setShowSettings] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info' | 'history'>('all');

    const filteredAlerts = alerts.filter(a => filter === 'all' || a.type === filter);
    const displayAlerts = showAll ? filteredAlerts : filteredAlerts.slice(0, 5);

    // Handle recording attendance from alert action
    const handleRecordFromAlert = async (alert: Alert, status: 'present' | 'absent') => {
        if (!user) return;
        try {
            if (alert.metadata?.schedule_id) {
                await recordAttendance(alert.metadata.schedule_id, status, user.id);
                toast.success(status === 'present' ? 'تم تسجيل الحضور ✅' : 'تم تسجيل الغياب');
            }
            // Bulk record
            if (alert.metadata?.scheduleIds) {
                for (const sid of alert.metadata.scheduleIds) {
                    await recordAttendance(sid, status, user.id);
                }
                toast.success(`تم تسجيل ${alert.metadata.scheduleIds.length} أستاذ`);
            }
            dismissAlert(alert.id);
            refetch();
        } catch (err: any) {
            toast.error(err.message || 'فشل في التسجيل');
        }
    };

    const handleAction = (alert: Alert, actionType: string) => {
        switch (actionType) {
            case 'record_attendance':
                handleRecordFromAlert(alert, 'absent');
                break;
            case 'ignore':
                dismissAlert(alert.id);
                break;
            case 'view':
                if (alert.metadata?.teacher) onTeacherFilter?.(alert.metadata.teacher);
                markAsRead(alert.id);
                break;
            default:
                markAsRead(alert.id);
        }
    };

    const timeAgo = (date: Date) => {
        const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
        if (diff < 1) return 'الآن';
        if (diff < 60) return `منذ ${diff} دقيقة`;
        if (diff < 1440) return `منذ ${Math.floor(diff / 60)} ساعة`;
        return `منذ ${Math.floor(diff / 1440)} يوم`;
    };

    return (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <Bell size={18} className="text-amber-500" />
                    <h3 className="font-bold text-gray-900 text-sm">مركز التنبيهات</h3>
                    {unreadCount > 0 && (
                        <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={refetch}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        title="تحديث"
                    >
                        <RefreshCw size={14} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        title="إعدادات"
                    >
                        <Settings size={14} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <SettingsPanel
                    settings={settings}
                    onChange={saveSettings}
                    onRequestPermission={requestDesktopPermission}
                    onClose={() => setShowSettings(false)}
                />
            )}

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-100 overflow-x-auto">
                {(['all', 'critical', 'warning', 'info', 'history'] as const).map(f => {
                    const count = f === 'all' ? alerts.length : alerts.filter(a => a.type === f).length;
                    const labels: Record<string, string> = {
                        all: 'الكل', critical: '🔴 عاجل', warning: '🟡 تنبيه', info: '🟢 معلومة', history: '⚪ سجل',
                    };
                    return (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-shrink-0 px-3 py-2 text-[11px] font-medium transition-colors ${filter === f
                                ? 'text-blue-700 border-b-2 border-blue-500 bg-blue-50'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {labels[f]} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Alerts List */}
            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                {loading ? (
                    <div className="p-6 text-center">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
                    </div>
                ) : displayAlerts.length === 0 ? (
                    <div className="p-8 text-center">
                        <BellOff size={28} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">لا توجد تنبيهات</p>
                    </div>
                ) : (
                    displayAlerts.map(alert => (
                        <AlertCard
                            key={alert.id}
                            alert={alert}
                            onAction={handleAction}
                            onDismiss={() => dismissAlert(alert.id)}
                            onMarkRead={() => markAsRead(alert.id)}
                            timeAgo={timeAgo}
                        />
                    ))
                )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                    <div className="flex gap-2">
                        {!showAll && filteredAlerts.length > 5 && (
                            <button
                                onClick={() => setShowAll(true)}
                                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                <ChevronDown size={12} />
                                عرض الكل ({filteredAlerts.length})
                            </button>
                        )}
                        {showAll && (
                            <button
                                onClick={() => setShowAll(false)}
                                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                            >
                                عرض أقل
                            </button>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={dismissAll}
                            className="text-[11px] text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
                        >
                            <Eye size={12} />
                            قراءة الكل
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

/* ═══════════ Alert Card ═══════════ */

interface AlertCardProps {
    alert: Alert;
    onAction: (alert: Alert, actionType: string) => void;
    onDismiss: () => void;
    onMarkRead: () => void;
    timeAgo: (date: Date) => string;
}

const AlertCard = ({ alert, onAction, onDismiss, onMarkRead, timeAgo }: AlertCardProps) => {
    const cfg = TYPE_CONFIG[alert.type];

    return (
        <div
            className={`relative px-4 py-3 transition-colors ${!alert.read ? `${cfg.bg} border-r-4` : 'hover:bg-gray-50'
                }`}
            onClick={() => !alert.read && onMarkRead()}
        >
            {/* Dismiss button */}
            <button
                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                className="absolute top-2 left-2 p-1 hover:bg-gray-200 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                style={{ opacity: 1 }}
            >
                <X size={12} className="text-gray-400" />
            </button>

            {/* Content */}
            <div className="flex gap-3 pr-0">
                {/* Dot indicator */}
                <div className={`w-2 h-2 rounded-full ${cfg.dot} mt-1.5 shrink-0`} />

                <div className="flex-1 min-w-0">
                    {/* Type label + time */}
                    <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[10px] font-bold ${cfg.title}`}>{cfg.label}</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(alert.timestamp)}</span>
                    </div>

                    {/* Title */}
                    <p className={`text-xs font-bold ${!alert.read ? 'text-gray-900' : 'text-gray-600'} mb-0.5`}>
                        {alert.title}
                    </p>

                    {/* Message */}
                    <p className="text-[11px] text-gray-500 leading-relaxed">{alert.message}</p>

                    {/* Metadata tags */}
                    {alert.metadata && (alert.metadata.class || alert.metadata.room) && (
                        <div className="flex gap-1.5 mt-1.5">
                            {alert.metadata.class && (
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                    📍 {alert.metadata.class}
                                </span>
                            )}
                            {alert.metadata.room && (
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                    🚪 {alert.metadata.room}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    {alert.actionable && alert.actions && alert.actions.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                            {alert.actions.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); onAction(alert, action.type); }}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${action.primary
                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ═══════════ Settings Panel ═══════════ */

interface SettingsPanelProps {
    settings: AlertSettings;
    onChange: (s: AlertSettings) => void;
    onRequestPermission: () => void;
    onClose: () => void;
}

const SettingsPanel = ({ settings, onChange, onRequestPermission, onClose }: SettingsPanelProps) => (
    <div className="bg-gray-50 border-b border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-700">إعدادات التنبيهات</h4>
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg">
                <X size={14} className="text-gray-400" />
            </button>
        </div>

        {/* Type toggles */}
        <div className="space-y-2">
            <SettingToggle
                label="🔴 تنبيهات عاجلة"
                checked={settings.enabledTypes.critical}
                onChange={(v) => onChange({ ...settings, enabledTypes: { ...settings.enabledTypes, critical: v } })}
            />
            <SettingToggle
                label="🟡 تحذيرات"
                checked={settings.enabledTypes.warning}
                onChange={(v) => onChange({ ...settings, enabledTypes: { ...settings.enabledTypes, warning: v } })}
            />
            <SettingToggle
                label="🟢 معلومات"
                checked={settings.enabledTypes.info}
                onChange={(v) => onChange({ ...settings, enabledTypes: { ...settings.enabledTypes, info: v } })}
            />
        </div>

        <hr className="border-gray-200" />

        {/* Sound toggle */}
        <SettingToggle
            label="🔊 صوت التنبيهات"
            checked={settings.sound}
            onChange={(v) => onChange({ ...settings, sound: v })}
        />

        {/* Desktop notifications */}
        <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-600">🖥️ إشعارات سطح المكتب</span>
            {Notification.permission === 'granted' ? (
                <SettingToggle
                    label=""
                    checked={settings.desktopNotifications}
                    onChange={(v) => onChange({ ...settings, desktopNotifications: v })}
                />
            ) : (
                <button
                    onClick={onRequestPermission}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                >
                    تفعيل
                </button>
            )}
        </div>

        {/* Auto refresh interval */}
        <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-600">🔄 تحديث تلقائي</span>
            <select
                value={settings.autoRefresh}
                onChange={(e) => onChange({ ...settings, autoRefresh: parseInt(e.target.value) })}
                className="text-[11px] border border-gray-200 rounded px-2 py-1 outline-none"
            >
                <option value={30}>كل 30 ثانية</option>
                <option value={60}>كل دقيقة</option>
                <option value={120}>كل 2 دقيقة</option>
                <option value={300}>كل 5 دقائق</option>
            </select>
        </div>
    </div>
);

/* ═══════════ Setting Toggle ═══════════ */

const SettingToggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between">
        {label && <span className="text-[11px] text-gray-600">{label}</span>}
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'right-0.5' : 'right-4'}`} />
        </button>
    </div>
);

export default AlertsCenter;
