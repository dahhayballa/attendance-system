import { useEffect, useState } from 'react';
import SupervisorLayout from '../components/SupervisorLayout';
import { SectionHeader } from '../components/ui/LayoutElements';
import CurrentSessionCard from '../components/CurrentSessionCard';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const SupervisorNowPage = () => {
    const { t, i18n } = useTranslation();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const langCode = i18n.language === 'fr' ? 'fr-FR' : 'ar-MR';
    const timeStr = currentTime.toLocaleTimeString(langCode, { hour: '2-digit', minute: '2-digit' });
    const dayName = new Intl.DateTimeFormat(langCode, { weekday: 'long' }).format(currentTime);

    return (
        <SupervisorLayout>
            <div className="space-y-6">
                <div className="bg-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Clock size={24} />
                                {t('supervisor.nowPage.title')}
                            </h2>
                            <p className="text-blue-100 mt-1">{t('supervisor.nowPage.description')}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20 text-center">
                            <p className="text-sm text-blue-100">{dayName}</p>
                            <p className="text-3xl font-mono font-bold" dir="ltr">{timeStr}</p>
                        </div>
                    </div>
                    {/* Decoration bg */}
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute right-20 -top-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl"></div>
                </div>

                <div>
                    <SectionHeader 
                        title={t('supervisor.nowPage.sectionTitle')} 
                        subtitle={t('supervisor.nowPage.sectionSubtitle')} 
                    />

                    <div className="mt-4">
                        {/* 
                            For now, since we haven't modified the useCurrentSession hook to fetch via the new RPC,
                            it still fetches ALL current sessions. To fix this fully, useCurrentSession must be updated.
                            BUT to keep it working, we'll mount the card. 
                        */}
                        <CurrentSessionCard />
                    </div>
                </div>
            </div>
        </SupervisorLayout>
    );
};

export default SupervisorNowPage;
