import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SupervisorLayout from '../../components/SupervisorLayout';
import AdvancedFilters from '../../components/AdvancedFilters';
import AttendanceTable from '../../components/AttendanceTable';
import type { FilterOptions } from '../../types';

const AttendanceRecordsPage = () => {
    const [filters, setFilters] = useState<Partial<FilterOptions>>({});
    const { t } = useTranslation();

    return (
        <SupervisorLayout>
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {t('supervisor.attendanceRecordsPage.title')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {t('supervisor.attendanceRecordsPage.subtitle')}
                    </p>
                </div>

                {/* Filters */}
                <div>
                    <SectionHeader
                        title={t('supervisor.attendanceRecordsPage.searchTitle')}
                        subtitle={t('supervisor.attendanceRecordsPage.searchSubtitle')}
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

                {/* Table */}
                <div>
                    <SectionHeader
                        title={t('supervisor.attendanceRecordsPage.tableTitle')}
                        subtitle={t('supervisor.attendanceRecordsPage.tableSubtitle')}
                    />
                    <div className="mt-3">
                        <AttendanceTable filters={filters} />
                    </div>
                </div>
            </div>
        </SupervisorLayout>
    );
};

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
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center"><span className="bg-gray-50 px-3"><div className="w-1.5 h-1.5 bg-gray-300 rounded-full" /></span></div>
    </div>
);

export default AttendanceRecordsPage;
