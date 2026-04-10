import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../../shared/components/layout/Layout';
import { supervisorAssignmentsService, SupervisorAssignment } from '../../../services/supabase/supervisor-assignments.service';
import { adminService } from '../../../services/supabase/admin.service';
import Card from '../../../shared/components/ui/Card';
import Button from '../../../shared/components/ui/Button';
import { useToast } from '../../../shared/hooks/useToast';
import { 
    Trash2, Users, Building, BookOpen, UserPlus, 
    LayoutGrid, List, AlertCircle, ChevronRight 
} from 'lucide-react';
import Loading from '../../../shared/components/ui/Loading';

export const SupervisorAssignmentsPage = () => {
    const { t } = useTranslation();
    const [assignments, setAssignments] = useState<SupervisorAssignment[]>([]);
    const [supervisors, setSupervisors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');
    
    // Options for selects
    const [filterOptions, setFilterOptions] = useState<{ classes: string[], subjects: {label: string, value: string}[] }>({ classes: [], subjects: [] });
    
    const { toast } = useToast();

    // Form state
    const [supervisorId, setSupervisorId] = useState('');
    const [type, setType] = useState<'class' | 'subject' | 'all'>('all');
    const [value, setValue] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [assignData, supData, optionsData] = await Promise.all([
                supervisorAssignmentsService.getAssignments(),
                supervisorAssignmentsService.getSupervisors(),
                adminService.getFiltersOptions()
            ]);
            setAssignments(assignData);
            setSupervisors(supData);
            setFilterOptions({
                classes: optionsData.classes,
                subjects: optionsData.subjects
            });
        } catch (err) {
            toast.error(t('admin.supervisors.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supervisorId) return toast.error(t('admin.supervisors.supervisorRequired'));
        if (type !== 'all' && !value) return toast.error(t('admin.supervisors.valueRequired'));

        setIsSubmitting(true);
        try {
            await supervisorAssignmentsService.createAssignment({
                supervisor_id: supervisorId,
                assignment_type: type,
                assignment_value: type === 'all' ? null : value
            });
            toast.success(t('admin.supervisors.createSuccess'));

            // Reset form
            setSupervisorId('');
            setType('all');
            setValue('');

            // Reload
            loadData();
        } catch (err) {
            toast.error(t('admin.supervisors.createError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t('admin.supervisors.deleteConfirm'))) return;
        try {
            await supervisorAssignmentsService.deleteAssignment(id);
            toast.success(t('admin.supervisors.deleteSuccess'));
            loadData();
        } catch (err) {
            toast.error(t('admin.supervisors.deleteError'));
        }
    };

    const groupedSupervisors = supervisors.map(sup => {
        const supAssignments = assignments.filter(a => a.supervisor_id === sup.id);
        return {
            ...sup,
            assignments: supAssignments
        };
    }).sort((a, b) => {
        if (a.assignments.length === 0 && b.assignments.length > 0) return 1;
        if (a.assignments.length > 0 && b.assignments.length === 0) return -1;
        return 0;
    });

    return (
        <Layout>
            <div className="space-y-5 pb-12 animate-in fade-in duration-700" dir="ltr">
                
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    
                    <div className="relative z-10 flex items-center gap-3 text-left">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-950 border border-gray-100 uppercase font-black">
                            <Users size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-950 tracking-tight">
                                {t('admin.supervisors.pageTitle')}
                            </h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{t('admin.supervisors.pageSubtitle')}</p>
                        </div>
                    </div>

                    <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-fit border border-gray-100 relative z-10">
                        <button 
                            onClick={() => setViewMode('grouped')}
                            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'grouped' ? 'bg-white text-gray-950 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutGrid size={13} /> Vue Superviseur
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white text-gray-950 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <List size={13} /> Liste Globale
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* ── New Assignment Form ── */}
                    <Card className="xl:col-span-4 rounded-3xl border-gray-100 shadow-sm self-start" padding="p-6">
                        <h3 className="font-black text-gray-950 text-[11px] uppercase tracking-widest mb-6 flex items-center gap-3">
                            <UserPlus size={15} className="text-gray-950" />
                            {t('admin.supervisors.newAssignment')}
                        </h3>

                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('admin.supervisors.supervisorLabel')}</label>
                                <select
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black text-gray-950 focus:ring-1 focus:ring-gray-200 focus:border-gray-400 outline-none transition-all cursor-pointer"
                                    value={supervisorId}
                                    onChange={(e) => setSupervisorId(e.target.value)}
                                    required
                                >
                                    <option value="">{t('admin.supervisors.selectSupervisor')}</option>
                                    {supervisors.map(s => (
                                        <option key={s.id} value={s.id}>{s.name || s.email}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('admin.supervisors.assignmentTypeLabel')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['all', 'class', 'subject'] as const).map(tKey => (
                                        <button
                                            key={tKey}
                                            type="button"
                                            onClick={() => { setType(tKey); setValue(''); }}
                                            className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${type === tKey ? 'bg-gray-900 border-gray-900 text-white shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                                        >
                                            {tKey === 'all' ? 'Toutes' : tKey === 'class' ? 'Classe' : 'Matière'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {type !== 'all' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Sélectionner {type === 'class' ? 'la Classe' : 'la Matière'}
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black text-gray-950 focus:ring-1 focus:ring-gray-200 focus:border-gray-400 outline-none transition-all cursor-pointer"
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                        required
                                    >
                                        <option value="">{type === 'class' ? 'Choisir la classe...' : 'Choisir la matière...'}</option>
                                        {type === 'class' 
                                            ? filterOptions.classes.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                              ))
                                            : filterOptions.subjects.map(s => {
                                                const val = s.value.split('|')[0];
                                                return <option key={val} value={val}>{s.label}</option>;
                                              })
                                        }
                                    </select>
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                fullWidth 
                                loading={isSubmitting} 
                                className="py-2.5 bg-gray-900 border-none text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black shadow-sm active:scale-95 transition-all mt-2"
                            >
                                {t('admin.supervisors.addButton')}
                            </Button>
                        </form>
                    </Card>

                    {/* ── Visualizations ── */}
                    <div className="xl:col-span-8 space-y-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-gray-100">
                                <Loading />
                                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-4">{t('admin.supervisors.loadingAssignments')}</span>
                            </div>
                        ) : viewMode === 'list' ? (
                            <Card className="rounded-3xl shadow-sm border-gray-100 overflow-hidden" padding="p-0">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                    <span className="font-black text-gray-950 text-[10px] uppercase tracking-widest">{t('admin.supervisors.listRules', 'Liste complète des règles')}</span>
                                    <span className="bg-gray-950 text-white text-[9px] font-black px-2 py-0.5 rounded-xl uppercase tracking-widest">
                                        {assignments.length}
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 font-black tracking-widest">{t('admin.supervisors.colSupervisor')}</th>
                                                <th className="px-4 py-3 font-black tracking-widest">{t('admin.supervisors.colType')}</th>
                                                <th className="px-4 py-3 font-black tracking-widest">{t('admin.supervisors.colValue')}</th>
                                                <th className="px-4 py-3 font-black tracking-widest text-center">{t('admin.supervisors.colActions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {assignments.map(a => (
                                                <tr key={a.id} className="group hover:bg-gray-50/50 transition-all border-b border-gray-50">
                                                    <td className="px-4 py-2.5 font-black text-gray-950 uppercase tracking-tight text-xs">{a.user?.name || a.user?.email}</td>
                                                    <td className="px-4 py-2.5">
                                                        {a.assignment_type === 'all' && <span className="text-purple-600 bg-purple-50 px-2 py-0.5 font-black text-[9px] uppercase tracking-widest rounded-xl border border-purple-100">Global</span>}
                                                        {a.assignment_type === 'class' && <span className="text-blue-600 bg-blue-50 px-2 py-0.5 font-black text-[9px] uppercase tracking-widest rounded-xl border border-blue-100 flex items-center gap-1.5 w-fit"><Building size={10} /> Classe</span>}
                                                        {a.assignment_type === 'subject' && <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 font-black text-[9px] uppercase tracking-widest rounded-xl border border-emerald-100 flex items-center gap-1.5 w-fit"><BookOpen size={10} /> Matière</span>}
                                                    </td>
                                                    <td className="px-4 py-2.5 font-bold text-gray-400 text-[11px] uppercase tracking-tight">{a.assignment_value || 'Toutes les séances'}</td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <button 
                                                            onClick={() => handleDelete(a.id)} 
                                                            className="p-1 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groupedSupervisors.map((sup: any) => (
                                    <div key={sup.id} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:bg-gray-50/30 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight size={18} className="text-gray-200" />
                                        </div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 font-black text-lg border border-gray-100">
                                                {sup.name?.charAt(0) || sup.email?.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-gray-950 uppercase tracking-tight text-xs">{sup.name || sup.email}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{sup.role}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t('admin.supervisors.assignmentScope', "Scope d'affectation")}</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {sup.assignments.length > 0 ? (
                                                    sup.assignments.map((a: any) => (
                                                        <div key={a.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 pl-2 pr-1 py-1 rounded-xl group/badge shadow-sm">
                                                            <span className="text-[9px] font-black text-gray-950 uppercase tracking-tight">
                                                                {a.assignment_type === 'all' ? 'Accès Global' : a.assignment_value}
                                                            </span>
                                                            <button 
                                                                onClick={() => handleDelete(a.id)}
                                                                className="w-5 h-5 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:border-rose-100 transition-all"
                                                            >
                                                                <X size={8} />
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-500">
                                                        <AlertCircle size={12} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Sans affectation</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                            <span className="text-gray-400">Règles: {sup.assignments.length}</span>
                                            {sup.assignments.some((a: any) => a.assignment_type === 'all') && (
                                                <span className="text-purple-600 px-2 py-0.5 bg-purple-50 rounded-xl border border-purple-100">Super Admin</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

const X = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export default SupervisorAssignmentsPage;
