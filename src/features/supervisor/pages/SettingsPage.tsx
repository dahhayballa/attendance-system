import { useTranslation } from 'react-i18next';
import SupervisorLayout from '../components/SupervisorLayout';
import SettingsPanel from '../components/SettingsPanel';

const SettingsPage = () => {
    const { t } = useTranslation();

    return (
        <SupervisorLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {t('supervisor.settingsPage.title')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {t('supervisor.settingsPage.subtitle')}
                    </p>
                </div>

                <SettingsPanel />
            </div>
        </SupervisorLayout>
    );
};

export default SettingsPage;
