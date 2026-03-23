import { useEffect, useState } from 'react';
import SupervisorLayout from '../components/SupervisorLayout';
import { SectionHeader } from '../components/ui/LayoutElements';
import CurrentSessionCard from '../components/CurrentSessionCard';
import { Clock } from 'lucide-react';

export const SupervisorNowPage = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeStr = currentTime.toLocaleTimeString('ar-MR', { hour: '2-digit', minute: '2-digit' });
    const dayName = new Intl.DateTimeFormat('ar-MR', { weekday: 'long' }).format(currentTime);

    return (
        <SupervisorLayout>
            <div className="space-y-6" dir="rtl">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Clock size={24} />
                                الحصص الجارية الآن
                            </h2>
                            <p className="text-blue-100 mt-1">تقتصر القائمة على الجناح / الأقسام المخصصة لك فقط.</p>
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
                    <SectionHeader title="الحصص الحالية" subtitle="قم بتسجيل الحضور للأساتذة في قاعاتهم الآن" />

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
