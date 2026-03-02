import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SupervisorLayout from '../components/SupervisorLayout';
import AdvancedFilters from '../components/AdvancedFilters';
import AttendanceTable from '../components/AttendanceTable';
import ReportsPanel from '../components/ReportsPanel';
import type { FilterOptions } from '../types';
import {
    Download, ClipboardList
} from 'lucide-react';

/* ═══════════ Tab Config ═══════════ */

const TABS = [
    { key: 'records', label: 'سجل الحضور', icon: <ClipboardList size={15} /> },
    { key: 'export', label: 'التصدير والتقارير', icon: <Download size={15} /> },
] as const;

type TabKey = typeof TABS[number]['key'];

/* ═══════════ Page ═══════════ */

const ReportsPage = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('records');
    const [filters, setFilters] = useState<Partial<FilterOptions>>({});
    const { t } = useTranslation();

    return (
        <SupervisorLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {t('supervisor.reportsPage.title')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {t('supervisor.reportsPage.subtitle')}
                    </p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab.key
                                    ? 'text-blue-700 border-b-2 border-blue-500 bg-blue-50'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.icon}
                                {t(`supervisor.reportsPage.tabs.${tab.key}`)}
                            </button>
                        ))}
                    </div>

                    <div className="p-5">
                        {/* Tab 1: Records — Filters + Table */}
                        {activeTab === 'records' && (
                            <div className="space-y-6">
                                <div>
                                    <SectionHeader
                                        title={t('supervisor.reportsPage.filtersTitle')}
                                        subtitle={t('supervisor.reportsPage.filtersSubtitle')}
                                    />
                                    <div className="mt-3">
                                        <AdvancedFilters
                                            filters={filters}
                                            onFiltersChange={(f) => setFilters(prev => ({ ...prev, ...f }))}
                                            onReset={() => setFilters({})}
                                        />
                                    </div>
                                </div>

                                <Divider />

                                <div>
                                    <SectionHeader
                                        title={t('supervisor.reportsPage.tableTitle')}
                                        subtitle={t('supervisor.reportsPage.tableSubtitle')}
                                    />
                                    <div className="mt-3">
                                        <AttendanceTable filters={filters} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Export & Reports */}
                        {activeTab === 'export' && (
                            <div className="max-w-2xl mx-auto">
                                <ReportsPanel />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </SupervisorLayout>
    );
};

/* ═══════════ Shared ═══════════ */

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-blue-500 rounded-full" />
        <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
    </div>
);

const Divider = () => (
    <div className="relative">
        <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
            <span className="bg-white px-3">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
            </span>
        </div>
    </div>
);

export default ReportsPage;
