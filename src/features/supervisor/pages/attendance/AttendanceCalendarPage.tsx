import { useTranslation } from 'react-i18next';
import SupervisorLayout from '../../components/SupervisorLayout';
import WeeklyCalendar from '../../components/WeeklyCalendar';

const AttendanceCalendarPage = () => {
    const { t } = useTranslation();

    return (
        <SupervisorLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {t('supervisor.attendanceCalendarPage.title')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {t('supervisor.attendanceCalendarPage.subtitle')}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-800">
                                {t('supervisor.attendanceCalendarPage.weekTitle')}
                            </h3>
                            <span className="text-[10px] text-gray-500 font-medium px-2 py-1 bg-gray-200 rounded-full">
                                {t('supervisor.attendanceCalendarPage.weekSubtitle')}
                            </span>
                        </div>
                    </div>
                    <div className="p-4">
                        <WeeklyCalendar />
                    </div>
                </div>
            </div>
        </SupervisorLayout>
    );
};

export default AttendanceCalendarPage;
