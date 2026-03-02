import { useState } from 'react';
import { useSettings, type UserSettings } from '../hooks/useSettings';
import { useAuth } from '../../auth/hooks/useAuth';
import {
    Settings, Moon, Sun, Monitor, Palette,
    Bell, BellOff, Volume2,
    LayoutGrid, RefreshCw, Globe, User,
    RotateCcw, Download, Trash2,
    Check
} from 'lucide-react';

/* ═══════════ Component ═══════════ */

interface SettingsPanelProps {
    className?: string;
}

const SettingsPanel = ({ className = '' }: SettingsPanelProps) => {
    const { settings, update, updateNested, resetToDefaults } = useSettings();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'appearance' | 'notifications' | 'display' | 'language' | 'account'>('appearance');
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const exportSettings = () => {
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'supervisor_settings.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const clearCache = () => {
        const keys = ['supervisor_alert_settings', 'supervisor_saved_filters', 'supervisor_filter_cache'];
        keys.forEach(k => localStorage.removeItem(k));
    };

    const tabs = [
        { key: 'appearance' as const, label: 'المظهر', icon: <Palette size={15} /> },
        { key: 'notifications' as const, label: 'الإشعارات', icon: <Bell size={15} /> },
        { key: 'display' as const, label: 'العرض', icon: <LayoutGrid size={15} /> },
        { key: 'language' as const, label: 'اللغة', icon: <Globe size={15} /> },
        { key: 'account' as const, label: 'الحساب', icon: <User size={15} /> },
    ];

    return (
        <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <Settings size={18} className="text-gray-600 dark:text-gray-300" />
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">الإعدادات</h3>
                </div>
                <div className="flex gap-1.5">
                    <button onClick={exportSettings} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors" title="تصدير الإعدادات">
                        <Download size={14} className="text-gray-500" />
                    </button>
                    <button onClick={() => setShowResetConfirm(true)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors" title="إعادة التعيين">
                        <RotateCcw size={14} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-medium whitespace-nowrap transition-colors ${activeTab === tab.key
                            ? 'text-blue-700 dark:text-blue-400 border-b-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
                {activeTab === 'appearance' && (
                    <AppearanceTab settings={settings} update={update} />
                )}
                {activeTab === 'notifications' && (
                    <NotificationsTab settings={settings} updateNested={updateNested} />
                )}
                {activeTab === 'display' && (
                    <DisplayTab settings={settings} updateNested={updateNested} />
                )}
                {activeTab === 'language' && (
                    <LanguageTab settings={settings} update={update} />
                )}
                {activeTab === 'account' && (
                    <AccountTab user={user} onClearCache={clearCache} />
                )}
            </div>

            {/* Reset Confirm Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">إعادة تعيين الإعدادات</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">سيتم إعادة جميع الإعدادات إلى القيم الافتراضية. هل أنت متأكد؟</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { resetToDefaults(); setShowResetConfirm(false); }}
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
                            >
                                إعادة التعيين
                            </button>
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ═══════════ Appearance Tab ═══════════ */

const AppearanceTab = ({ settings, update }: {
    settings: UserSettings;
    update: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}) => (
    <div className="space-y-5">
        {/* Theme */}
        <Section title="المظهر" icon={<Moon size={14} />}>
            <div className="flex gap-2">
                {([
                    { key: 'light' as const, icon: <Sun size={16} />, label: 'فاتح' },
                    { key: 'dark' as const, icon: <Moon size={16} />, label: 'داكن' },
                    { key: 'system' as const, icon: <Monitor size={16} />, label: 'تلقائي' },
                ] as const).map(t => (
                    <button
                        key={t.key}
                        onClick={() => update('theme', t.key)}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${settings.theme === t.key
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-md shadow-blue-100'
                            : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        {t.icon}
                        <span className="text-[10px] font-medium">{t.label}</span>
                    </button>
                ))}
            </div>
        </Section>

        {/* Accent Color */}
        <Section title="اللون الرئيسي" icon={<Palette size={14} />}>
            <div className="flex gap-3">
                {([
                    { key: 'blue' as const, color: 'bg-blue-500', ring: 'ring-blue-300' },
                    { key: 'green' as const, color: 'bg-green-500', ring: 'ring-green-300' },
                    { key: 'purple' as const, color: 'bg-purple-500', ring: 'ring-purple-300' },
                ] as const).map(c => (
                    <button
                        key={c.key}
                        onClick={() => update('accentColor', c.key)}
                        className={`w-9 h-9 rounded-full ${c.color} transition-all ${settings.accentColor === c.key
                            ? `ring-4 ${c.ring} scale-110`
                            : 'opacity-60 hover:opacity-100'
                            }`}
                    >
                        {settings.accentColor === c.key && (
                            <Check size={16} className="text-white mx-auto" />
                        )}
                    </button>
                ))}
            </div>
        </Section>

        {/* Font Size */}
        <Section title="حجم الخط" icon={<Settings size={14} />}>
            <div className="flex gap-2">
                {([
                    { key: 'small' as const, label: 'صغير', sample: 'text-xs' },
                    { key: 'medium' as const, label: 'متوسط', sample: 'text-sm' },
                    { key: 'large' as const, label: 'كبير', sample: 'text-base' },
                ] as const).map(s => (
                    <button
                        key={s.key}
                        onClick={() => update('fontSize', s.key)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border ${settings.fontSize === s.key
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700'
                            : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <span className={s.sample}>{s.label}</span>
                    </button>
                ))}
            </div>
        </Section>
    </div>
);

/* ═══════════ Notifications Tab ═══════════ */

const NotificationsTab = ({ settings, updateNested }: {
    settings: UserSettings;
    updateNested: <K extends keyof UserSettings>(key: K, partial: Partial<UserSettings[K]>) => void;
}) => (
    <div className="space-y-3">
        <Section title="الإشعارات" icon={<Bell size={14} />}>
            <div className="space-y-2.5">
                <Toggle
                    label="تنبيهات الصوت"
                    icon={<Volume2 size={14} />}
                    checked={settings.notifications.sound}
                    onChange={(v) => updateNested('notifications', { sound: v })}
                />
                <Toggle
                    label="إشعارات سطح المكتب"
                    icon={<Monitor size={14} />}
                    checked={settings.notifications.desktop}
                    onChange={(v) => {
                        if (v && 'Notification' in window && Notification.permission !== 'granted') {
                            Notification.requestPermission().then(perm => {
                                updateNested('notifications', { desktop: perm === 'granted' });
                            });
                        } else {
                            updateNested('notifications', { desktop: v });
                        }
                    }}
                />
            </div>
        </Section>

        <Section title="أنواع التنبيهات" icon={<BellOff size={14} />}>
            <div className="space-y-2.5">
                <Toggle
                    label="🔴 تنبيهات حرجة (عاجلة)"
                    checked={settings.notifications.critical}
                    onChange={(v) => updateNested('notifications', { critical: v })}
                />
                <Toggle
                    label="🟡 تنبيهات تحذيرية"
                    checked={settings.notifications.warning}
                    onChange={(v) => updateNested('notifications', { warning: v })}
                />
                <Toggle
                    label="🟢 تنبيهات معلوماتية"
                    checked={settings.notifications.info}
                    onChange={(v) => updateNested('notifications', { info: v })}
                />
            </div>
        </Section>
    </div>
);

/* ═══════════ Display Tab ═══════════ */

const DisplayTab = ({ settings, updateNested }: {
    settings: UserSettings;
    updateNested: <K extends keyof UserSettings>(key: K, partial: Partial<UserSettings[K]>) => void;
}) => (
    <div className="space-y-5">
        <Section title="صفوف لكل صفحة" icon={<LayoutGrid size={14} />}>
            <div className="flex gap-2">
                {[10, 25, 50, 100].map(n => (
                    <button
                        key={n}
                        onClick={() => updateNested('display', { rowsPerPage: n })}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${settings.display.rowsPerPage === n
                            ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                            }`}
                    >
                        {n}
                    </button>
                ))}
            </div>
        </Section>

        <Section title="عناصر الواجهة" icon={<LayoutGrid size={14} />}>
            <div className="space-y-2.5">
                <Toggle
                    label="عرض ملخص الحصة الحالية"
                    checked={settings.display.showCurrentSession}
                    onChange={(v) => updateNested('display', { showCurrentSession: v })}
                />
                <Toggle
                    label="عرض التنبيهات"
                    checked={settings.display.showAlerts}
                    onChange={(v) => updateNested('display', { showAlerts: v })}
                />
            </div>
        </Section>

        <Section title="التحديث التلقائي" icon={<RefreshCw size={14} />}>
            <select
                value={settings.display.autoRefresh}
                onChange={(e) => updateNested('display', { autoRefresh: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs outline-none focus:border-blue-300 text-gray-700 dark:text-gray-200"
            >
                <option value={0}>معطل</option>
                <option value={30}>كل 30 ثانية</option>
                <option value={60}>كل دقيقة</option>
                <option value={120}>كل 2 دقيقة</option>
                <option value={300}>كل 5 دقائق</option>
            </select>
        </Section>
    </div>
);

/* ═══════════ Language Tab ═══════════ */

const LanguageTab = ({ settings, update }: {
    settings: UserSettings;
    update: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}) => (
    <div className="space-y-5">
        <Section title="اللغة" icon={<Globe size={14} />}>
            <div className="flex gap-2">
                {([
                    { key: 'ar' as const, label: 'العربية', flag: '🇲🇷' },
                    { key: 'fr' as const, label: 'Français', flag: '🇫🇷' },
                    { key: 'en' as const, label: 'English', flag: '🇬🇧' },
                ] as const).map(lang => (
                    <button
                        key={lang.key}
                        onClick={() => update('language', lang.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all border ${settings.language === lang.key
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 shadow-md'
                            : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <span className="text-base">{lang.flag}</span>
                        {lang.label}
                    </button>
                ))}
            </div>
        </Section>

        <Toggle
            label="الاحتفاظ بالمصطلحات الفرنسية للمواد"
            checked={settings.preserveFrenchTerms}
            onChange={(v) => update('preserveFrenchTerms', v)}
        />
    </div>
);

/* ═══════════ Account Tab ═══════════ */

const AccountTab = ({ user, onClearCache }: { user: any; onClearCache: () => void }) => (
    <div className="space-y-4">
        <Section title="معلومات الحساب" icon={<User size={14} />}>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3 border border-gray-200 dark:border-gray-700">
                <InfoRow label="الاسم" value={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'مشرف'} />
                <InfoRow label="البريد" value={user?.email || '—'} />
                <InfoRow label="الدور" value="مشرف" />
                <InfoRow label="آخر تسجيل" value={
                    user?.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleString('ar-MR')
                        : '—'
                } />
            </div>
        </Section>

        <Section title="إدارة البيانات" icon={<Trash2 size={14} />}>
            <div className="space-y-2">
                <button
                    onClick={onClearCache}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700 rounded-xl text-xs font-medium hover:bg-amber-100 transition-colors"
                >
                    <Trash2 size={13} />
                    مسح الذاكرة المؤقتة
                </button>
            </div>
        </Section>
    </div>
);

/* ═══════════ Shared Sub-components ═══════════ */

const Section = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
    <div>
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2.5 flex items-center gap-1.5">
            {icon && <span className="text-blue-500">{icon}</span>}
            {title}
        </label>
        {children}
    </div>
);

const Toggle = ({ label, icon, checked, onChange }: {
    label: string; icon?: React.ReactNode; checked: boolean; onChange: (v: boolean) => void;
}) => (
    <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
            {icon && <span className="text-gray-400">{icon}</span>}
            <span className="text-xs text-gray-600 dark:text-gray-300">{label}</span>
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-10 h-5.5 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            style={{ width: 40, height: 22 }}
        >
            <span
                className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform`}
                style={{
                    width: 18, height: 18, top: 2,
                    transform: checked ? 'translateX(2px)' : 'translateX(20px)',
                }}
            />
        </button>
    </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-800 dark:text-gray-200">{value}</span>
    </div>
);

export default SettingsPanel;
