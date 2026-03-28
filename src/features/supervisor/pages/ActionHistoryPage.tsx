import SupervisorLayout from '../components/SupervisorLayout';
import ActionHistoryPanel from '../components/ActionHistoryPanel';
import { useTranslation } from 'react-i18next';

export const ActionHistoryPage = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    return (
        <SupervisorLayout>
            <div className={`space-y-6 pb-8 ${isRtl ? 'font-arabic' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="sticky top-[-24px] z-20 bg-white border-b border-gray-100 px-4 py-4 -mx-4 shadow-sm">
                    <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="text-orange-500 text-xl">📜</span> 
                        {t('supervisor.actionHistoryPage.title')}
                    </h1>
                    <p className="text-gray-400 font-medium text-[11px] mt-0.5 uppercase tracking-wider">
                        {t('supervisor.actionHistoryPage.subtitle')}
                    </p>
                </div>

                <ActionHistoryPanel />
            </div>
        </SupervisorLayout>
    );
};

export default ActionHistoryPage;
