import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SupervisorLayout from '../components/SupervisorLayout';
import { SectionHeader } from '../components/ui/LayoutElements';
import CurrentSessionCard from '../components/CurrentSessionCard';
import { Clock } from 'lucide-react';

export const SupervisorNowPage = () => {
    const { t, i18n } = useTranslation();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const langCode = i18n.language === 'ar' ? 'ar-EG' : 'fr-FR';
    const timeStr = currentTime.toLocaleTimeString(langCode, { 
        hour: '2-digit', 
        minute: '2-digit',
        numberingSystem: 'latn' 
    });
    const dayName = new Intl.DateTimeFormat(langCode, { weekday: 'long' }).format(currentTime);

    // Capitalize first letter of dayName
    const formattedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const isRtl = i18n.language === 'ar';

    return (
        <SupervisorLayout>
            <div className={`space-y-6 ${isRtl ? 'font-arabic' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="bg-white rounded-2xl p-6 text-gray-800 border-l-4 border-orange-500 shadow-sm relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                                <Clock size={24} className="text-orange-500" />
                                {t('supervisor.nowPage.title', 'Tableau de Bord')}
                            </h2>
                            <p className="text-gray-500 mt-1">{t('supervisor.nowPage.description', 'Suivi en temps réel des sessions et présences')}</p>
                        </div>
                        <div className="bg-orange-50 px-6 py-3 rounded-xl border border-orange-100 text-center">
                            <p className="text-sm text-orange-600 font-medium">{formattedDay}</p>
                            <p className="text-3xl font-mono font-bold text-gray-900">{timeStr}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <SectionHeader 
                        title={t('supervisor.nowPage.sectionTitle', 'Session en Cours')} 
                        subtitle={t('supervisor.nowPage.sectionSubtitle', 'Détails et pointage de la session actuelle')} 
                    />

                    <div className="mt-4">
                        <CurrentSessionCard />
                    </div>
                </div>
            </div>
        </SupervisorLayout>
    );
};

export default SupervisorNowPage;
