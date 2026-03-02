import { useTranslation } from 'react-i18next';
import SupervisorLayout from '../components/SupervisorLayout';
import AlertsCenter from '../components/AlertsCenter';

const AlertsPage = () => {
    const { t } = useTranslation();

    return (
        <SupervisorLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {t('supervisor.alertsPage.title')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {t('supervisor.alertsPage.subtitle')}
                    </p>
                </div>

                <AlertsCenter />
            </div>
        </SupervisorLayout>
    );
};

export default AlertsPage;
