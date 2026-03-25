import SupervisorLayout from '../components/SupervisorLayout';
import ActionHistoryPanel from '../components/ActionHistoryPanel';
import { useTranslation } from 'react-i18next';

export const ActionHistoryPage = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    return (
        <SupervisorLayout>
            <div className={`space-y-6 pb-8 ${isRtl ? 'font-arabic' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-2">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            <span className="p-1.5 bg-orange-100 rounded-lg text-orange-500 text-lg leading-none">📜</span> 
                            {t('supervisor.history.title', 'Historique des pointages')}
                        </h1>
                    </div>
                </div>

                <ActionHistoryPanel className="h-[75vh]" />
            </div>
        </SupervisorLayout>
    );
};

export default ActionHistoryPage;
