import SupervisorLayout from '../components/SupervisorLayout';
import ActionHistoryPanel from '../components/ActionHistoryPanel';
import { useTranslation } from 'react-i18next';

export const ActionHistoryPage = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    return (
        <SupervisorLayout>
            <div className={`space-y-6 pb-8 ${isRtl ? 'font-arabic' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md px-5 py-3 rounded-xl border border-gray-100 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-2 -mx-2 px-6">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            <span className="p-1.5 bg-orange-100 rounded-lg text-orange-500 text-lg leading-none">📜</span> 
                            {t('supervisor.actionHistoryPage.title')}
                        </h1>
                        <p className="text-gray-500 font-medium text-sm mt-0.5">
                            {t('supervisor.actionHistoryPage.subtitle')}
                        </p>
                    </div>
                </div>

                <ActionHistoryPanel className="h-[75vh]" />
            </div>
        </SupervisorLayout>
    );
};

export default ActionHistoryPage;
