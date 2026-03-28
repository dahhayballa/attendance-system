import SupervisorLayout from '../components/SupervisorLayout';
import SettingsPanel from '../components/SettingsPanel';

const SettingsPage = () => {

    return (
        <SupervisorLayout>
            <div className="space-y-6">
                <SettingsPanel />
            </div>
        </SupervisorLayout>
    );
};

export default SettingsPage;
