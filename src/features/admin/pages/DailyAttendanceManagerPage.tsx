import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../../shared/components/layout/Layout';
import Card from '../../../shared/components/ui/Card';
import { getSchedules, recordAttendance } from '../../supervisor/services/attendanceService';
import { useAuth } from '../../auth/hooks/useAuth';
import { Search, CheckCircle, AlertTriangle, AlertOctagon, RefreshCw } from 'lucide-react';
import { Schedule } from '../../supervisor/types';
import { Modal } from '../../../shared/components/ui/Modal';
import { useToast } from '../../../shared/hooks/useToast';

export const DailyAttendanceManagerPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    const [modalState, setModalState] = useState<{
        scheduleId: string | null;
        teacherName: string;
    }>({ scheduleId: null, teacherName: '' });

    const [isUpdating, setIsUpdating] = useState(false);

    const getTodayNameFr = () => {
        const daysFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return daysFr[new Date().getDay()];
    };

    const loadTodaySchedules = async () => {
        try {
            setLoading(true);
            const todayFr = getTodayNameFr();
            // Fetch all schedules for today. Not restricted by active week, allowing global admin override for any week if needed,
            // or we could use useActiveWeek. Let's just fetch for today's day regardless of the week for safety, or we assume they filter.
            const data = await getSchedules({ day: todayFr });
            setSchedules(data || []);
        } catch (error) {
            console.error('Failed to load schedules:', error);
            toast.error(t('admin.dashboard.loadError', 'Erreur de chargement'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTodaySchedules();
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleStatusChange = async (status: 'present' | 'absent' | 'late') => {
        if (!modalState.scheduleId || !user) return;
        const targetId = modalState.scheduleId;
        try {
            setIsUpdating(true);
            await recordAttendance(
                targetId,
                status,
                user.id,
                `Modification Administrateur (${status})`
            );
            
            // Local UI update instantly
            setSchedules(prev => prev.map(s => s.id === targetId ? { ...s, status } : s));
            
            toast.success(t('supervisor.currentSessionCard.toast' + status.charAt(0).toUpperCase() + status.slice(1), 'Statut mis à jour'));
            setModalState({ scheduleId: null, teacherName: '' });
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erreur lors de la modification');
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredSchedules = schedules.filter(s => 
        s.teacher?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.class?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Layout>
            <div className="flex flex-col gap-6" dir="ltr">
                <div className="flex justify-between items-center bg-white border border-gray-100 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900 border-l-4 border-orange-500 pl-3">
                            <RefreshCw className="text-orange-500" /> Gestion Quotidienne
                        </h2>
                        <p className="text-gray-500 mt-2 font-medium">Modifier et forcer la présence des professeurs pour le dernier jour ({getTodayNameFr()})</p>
                    </div>
                </div>

                <Card className="shadow-sm border-gray-100 p-0 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Rechercher par professeur, classe, matière..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-200"
                                />
                            </div>
                        </div>
                        <div className="text-sm font-bold text-gray-500">
                            {filteredSchedules.length} Séances aujourd'hui
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-gray-500 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Heure</th>
                                    <th className="px-6 py-4 font-bold text-center">Progression</th>
                                    <th className="px-6 py-4 font-bold">Professeur</th>
                                    <th className="px-6 py-4 font-bold">Classe & Matière</th>
                                    <th className="px-6 py-4 font-bold text-center">Statut Actuel</th>
                                    <th className="px-6 py-4 font-bold text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">Chargement des séances...</td>
                                    </tr>
                                ) : filteredSchedules.length > 0 ? (
                                    filteredSchedules.map(session => {
                                        // Calculate progress if session is ongoing today
                                        const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
                                        const [sh, sm] = (session.time_start || '00:00').split(':').map(Number);
                                        const [eh, em] = (session.time_end || '00:00').split(':').map(Number);
                                        const startMins = sh * 60 + sm;
                                        const endMins = eh * 60 + em;
                                        const total = endMins - startMins;
                                        const elapsed = currentMins - startMins;
                                        
                                        let progress = 0;
                                        if (currentMins >= endMins) progress = 100;
                                        else if (currentMins >= startMins) progress = Math.round((elapsed / total) * 100);

                                        const isPresent = session.status === 'present';
                                        const isLate = session.status === 'late';
                                        
                                        // Si c'est absent mais sans recorded_by, c'est l'absence automatique du système, que l'admin souhaite voir comme "En attente" (non traité)
                                        const isAutoAbsent = session.status === 'absent' && !session.recorded_by;
                                        const isPending = !session.status || session.status === 'pending' || isAutoAbsent;
                                        
                                        return (
                                            <tr key={session.id} className="bg-white hover:bg-orange-50/30 transition-colors group">
                                                <td className="px-6 py-4 font-mono font-bold text-gray-600">
                                                    {session.time_start?.slice(0, 5)} - {session.time_end?.slice(0, 5)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="w-16 h-2 bg-gray-100 rounded-full mx-auto overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${progress === 100 ? 'bg-gray-400' : progress > 0 ? 'bg-orange-500' : 'bg-transparent'}`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900">{session.teacher}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-700">{session.class}</div>
                                                    <div className="text-xs text-gray-400 mt-0.5">{session.subject}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {isPending ? (
                                                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold border border-gray-200">
                                                            En attente
                                                        </span>
                                                    ) : (
                                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                                            isPresent ? 'bg-green-50 text-green-700 border-green-200' :
                                                            isLate ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            'bg-red-50 text-red-700 border-red-200'
                                                        }`}>
                                                            {isPresent ? 'Présent' : isLate ? 'En retard' : 'Absent'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => setModalState({ scheduleId: session.id, teacherName: session.teacher || '' })}
                                                        className="px-3 py-1.5 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 font-bold text-xs rounded-xl shadow-sm transition-all"
                                                    >
                                                        Modifier / Forcer
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">
                                            Aucune séance trouvée.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* MODAL POUR MODIFIER L'ÉTAT */}
                {modalState.scheduleId && (
                    <Modal title={`Modifier l'état : ${modalState.teacherName}`} onClose={() => !isUpdating && setModalState({ scheduleId: null, teacherName: '' })}>
                        <div className="space-y-4 pt-2">
                            <p className="text-sm font-medium text-gray-600 mb-4">
                                En tant qu'administrateur, vous pouvez forcer le statut de présence de ce professeur. Cela écrasera toute donnée précédente avec la mention de cette intervention.
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleStatusChange('present')}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 transition-all font-bold group disabled:opacity-50"
                                >
                                    <CheckCircle size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                                    <span>Marquer Présent</span>
                                </button>
                                
                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleStatusChange('late')}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all font-bold group disabled:opacity-50"
                                >
                                    <AlertTriangle size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                                    <span>Marquer Retard</span>
                                </button>

                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleStatusChange('absent')}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 transition-all font-bold group disabled:opacity-50"
                                >
                                    <AlertOctagon size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                                    <span>Marquer Absent</span>
                                </button>
                            </div>

                            <button 
                                onClick={() => setModalState({ scheduleId: null, teacherName: '' })}
                                disabled={isUpdating}
                                className="w-full py-2.5 mt-4 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all"
                            >
                                Annuler
                            </button>
                        </div>
                    </Modal>
                )}
            </div>
        </Layout>
    );
};

export default DailyAttendanceManagerPage;
