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
    const weekDays = t('common.weekDays', { returnObjects: true }) as string[];
    
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentTime, setCurrentTime] = useState(new Date());

    const daysDb = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const [selectedDayDb, setSelectedDayDb] = useState(daysDb[currentDayIndex]);

    const [modalState, setModalState] = useState<{
        scheduleId: string | null;
        teacherName: string;
    }>({ scheduleId: null, teacherName: '' });

    const [isUpdating, setIsUpdating] = useState(false);

    const loadSchedules = async () => {
        try {
            setLoading(true);
            const data = await getSchedules({ day: selectedDayDb });
            setSchedules(data || []);
        } catch (error) {
            console.error('Failed to load schedules:', error);
            toast.error(t('admin.daily.loadError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchedules();
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDayDb]);

    const handleStatusChange = async (status: 'present' | 'absent' | 'late') => {
        if (!modalState.scheduleId || !user) return;
        const targetId = modalState.scheduleId;
        try {
            setIsUpdating(true);
            await recordAttendance(
                targetId,
                status,
                user.id,
                `Correction Administrateur (${status})`
            );
            
            // Local UI update instantly
            setSchedules(prev => prev.map(s => s.id === targetId ? { ...s, status } : s));
            
            toast.success(t('admin.daily.successUpdate'));
            setModalState({ scheduleId: null, teacherName: '' });
        } catch (error: any) {
            console.error(error);
            toast.error(t('admin.daily.errorUpdate'));
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredSchedules = schedules.filter(s => {
        const matchesSearch = s.teacher?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              s.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              s.class?.toLowerCase().includes(searchQuery.toLowerCase());
                              
        const isAutoAbsent = s.status === 'absent' && !s.recorded_by;
        const mappedStatus = (!s.status || s.status === 'pending' || isAutoAbsent) ? 'pending' : s.status;
        
        const matchesStatus = statusFilter === 'all' || mappedStatus === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    return (
        <Layout>
            <div className="space-y-5 pb-12 animate-in fade-in duration-700" dir="ltr">
                <div className="flex justify-between items-center bg-white border border-gray-100 p-4 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900 border border-gray-100">
                             <RefreshCw size={18} className="text-gray-950" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-950 tracking-tight">
                                {t('admin.daily.pageTitle')}
                            </h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{t('admin.daily.pageSubtitle')} ({weekDays[daysDb.indexOf(selectedDayDb)] || selectedDayDb})</p>
                        </div>
                    </div>
                </div>

                <Card className="shadow-sm border-gray-100 p-0 overflow-hidden rounded-3xl">
                    <div className="p-3.5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute ltr:left-3 rtl:right-3 top-2 text-gray-400" size={13} />
                                <input
                                    type="text"
                                    placeholder={t('admin.daily.searchPlaceholder')}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full ltr:pl-8 ltr:pr-4 rtl:pr-8 rtl:pl-4 py-1.5 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-400 transition-all"
                                />
                            </div>
                            
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="w-full md:w-auto py-1.5 px-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-400 transition-all bg-white"
                            >
                                <option value="all">{t('admin.daily.allStatuses')}</option>
                                <option value="pending">{t('admin.daily.statusPending')}</option>
                                <option value="present">{t('admin.daily.btnPresent')}</option>
                                <option value="absent">{t('admin.daily.btnAbsent')}</option>
                                <option value="late">{t('admin.daily.btnLate')}</option>
                            </select>
                            
                            <select
                                value={selectedDayDb}
                                onChange={e => setSelectedDayDb(e.target.value)}
                                className="w-full md:w-auto py-1.5 px-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-400 transition-all bg-white"
                            >
                                {daysDb.map((day, idx) => (
                                    <option key={day} value={day}>{weekDays[idx] || day}</option>
                                ))}
                            </select>
                        </div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                            {filteredSchedules.length} {t('admin.liveDashboard.statSessions')}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 font-black tracking-widest">{t('admin.daily.colTime')}</th>
                                    <th className="px-4 py-3 font-black tracking-widest text-center">{t('admin.liveDashboard.progressLabel')}</th>
                                    <th className="px-4 py-3 font-black tracking-widest">{t('admin.daily.colTeacher')}</th>
                                    <th className="px-4 py-3 font-black tracking-widest">{t('admin.daily.colClass')} & {t('admin.daily.colSubject')}</th>
                                    <th className="px-4 py-3 font-black tracking-widest text-center">{t('admin.daily.colStatus')}</th>
                                    <th className="px-4 py-3 font-black tracking-widest text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">{t('admin.daily.loading')}</td>
                                    </tr>
                                ) : filteredSchedules.length > 0 ? (
                                    filteredSchedules.map(session => {
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
                                        const isAutoAbsent = session.status === 'absent' && !session.recorded_by;
                                        const isPending = !session.status || session.status === 'pending' || isAutoAbsent;
                                        
                                        return (
                                            <tr key={session.id} className="bg-white hover:bg-gray-50/50 transition-colors group border-b border-gray-50">
                                                <td className="px-4 py-2.5 font-black text-gray-950 text-[11px]">
                                                    {session.time_start?.slice(0, 5)} - {session.time_end?.slice(0, 5)}
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <div className="w-12 h-1 bg-gray-50 rounded-full mx-auto overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-700 ${progress === 100 ? 'bg-gray-400' : progress > 0 ? 'bg-orange-500' : 'bg-transparent'}`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 font-black text-gray-950 uppercase tracking-tight text-xs">{session.teacher}</td>
                                                <td className="px-4 py-2.5">
                                                    <div className="font-bold text-gray-950 text-xs uppercase tracking-tight">{session.class}</div>
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{session.subject}</div>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    {isPending ? (
                                                        <span className="px-2 py-1 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-100">
                                                            {t('admin.daily.statusPending')}
                                                        </span>
                                                    ) : (
                                                        <span className={`px-2 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                                                            isPresent ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            isLate ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-rose-50 text-rose-600 border-rose-100'
                                                        }`}>
                                                            {isPresent ? t('admin.daily.btnPresent') : isLate ? t('admin.daily.btnLate') : t('admin.daily.btnAbsent')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <button 
                                                        onClick={() => setModalState({ scheduleId: session.id, teacherName: session.teacher || '' })}
                                                        className="px-3 py-1.5 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-sm active:scale-95"
                                                    >
                                                        {t('supervisor.currentSessionCard.edit')}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">
                                            {t('admin.daily.noSessions')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {modalState.scheduleId && (
                    <Modal title={t('admin.daily.modalTitle', { name: modalState.teacherName })} onClose={() => !isUpdating && setModalState({ scheduleId: null, teacherName: '' })}>
                        <div className="space-y-4 pt-2">
                            <p className="text-sm font-medium text-gray-600 mb-4">
                                {t('admin.liveDashboard.pageSubtitle')}
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleStatusChange('present')}
                                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-100 transition-all font-black uppercase tracking-widest text-[10px] group disabled:opacity-50"
                                >
                                    <CheckCircle size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                                    <span>{t('admin.daily.btnPresent')}</span>
                                </button>
                                
                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleStatusChange('late')}
                                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-amber-100 bg-amber-50/50 text-amber-600 hover:bg-amber-100 transition-all font-black uppercase tracking-widest text-[10px] group disabled:opacity-50"
                                >
                                    <AlertTriangle size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                                    <span>{t('admin.daily.btnLate')}</span>
                                </button>
 
                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleStatusChange('absent')}
                                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-rose-100 bg-rose-50/50 text-rose-600 hover:bg-rose-100 transition-all font-black uppercase tracking-widest text-[10px] group disabled:opacity-50"
                                >
                                    <AlertOctagon size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                                    <span>{t('admin.daily.btnAbsent')}</span>
                                </button>
                            </div>

                            <button 
                                onClick={() => setModalState({ scheduleId: null, teacherName: '' })}
                                disabled={isUpdating}
                                className="w-full py-2.5 mt-4 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-all"
                            >
                                {t('admin.daily.btnCancel')}
                            </button>
                        </div>
                    </Modal>
                )}
            </div>
        </Layout>
    );
};

export default DailyAttendanceManagerPage;
