import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../../shared/components/layout/Layout';
import { supervisorAssignmentsService, SupervisorAssignment } from '../../../services/supabase/supervisor-assignments.service';
import Card from '../../../shared/components/ui/Card';
import Button from '../../../shared/components/ui/Button';
import { useToast } from '../../../shared/hooks/useToast';
import { Trash2, Users, Building, BookOpen, UserPlus } from 'lucide-react';
import Loading from '../../../shared/components/ui/Loading';

export const SupervisorAssignmentsPage = () => {
    const { t } = useTranslation();
    const [assignments, setAssignments] = useState<SupervisorAssignment[]>([]);
    const [supervisors, setSupervisors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
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
            const [assignData, supData] = await Promise.all([
                supervisorAssignmentsService.getAssignments(),
                supervisorAssignmentsService.getSupervisors()
            ]);
            setAssignments(assignData);
            setSupervisors(supData);
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

    return (
        <Layout>
            <div className="flex flex-col gap-6" dir="ltr">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{t('admin.supervisors.pageTitle')}</h2>
                            <p className="text-sm font-medium text-gray-500 mt-1">{t('admin.supervisors.pageSubtitle')}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-col-reverse lg:flex-row">
                    {/* فورم الإضافة (Nouvelle Affectation) */}
                    <Card className="lg:col-span-1 border-t-4 border-orange-500 shadow-sm" padding="p-6">
                        <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <UserPlus size={18} className="text-orange-500" />
                            {t('admin.supervisors.newAssignment')}
                        </h3>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('admin.supervisors.supervisorLabel')}</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none transition-all shadow-sm"
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
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">{t('admin.supervisors.assignmentTypeLabel')}</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none transition-all shadow-sm"
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                >
                                    <option value="all">{t('admin.supervisors.typeAll')}</option>
                                    <option value="class">{t('admin.supervisors.typeClass')}</option>
                                    <option value="subject">{t('admin.supervisors.typeSubject')}</option>
                                </select>
                            </div>

                            {type !== 'all' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                        {type === 'class' ? t('admin.supervisors.classPlaceholder') : t('admin.supervisors.subjectPlaceholder')}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none transition-all shadow-sm"
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                        placeholder={t('admin.supervisors.valuePlaceholder')}
                                        required
                                    />
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                fullWidth 
                                loading={isSubmitting} 
                                className="mt-4 bg-orange-600 hover:bg-orange-700 text-white border-transparent"
                            >
                                {t('admin.supervisors.addButton')}
                            </Button>
                        </form>
                    </Card>

                    {/* قائمة التعيينات (Affectations Actuelles) */}
                    <Card className="lg:col-span-2 shadow-sm order-first lg:order-last" padding="p-0">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50 font-bold text-gray-800 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Users size={18} className="text-orange-500" />
                                {t('admin.supervisors.currentAssignments')}
                            </span>
                            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                                {assignments.length} Total
                            </span>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center flex items-center justify-center flex-col gap-4">
                                <Loading />
                                <span className="text-gray-400 font-medium text-sm">{t('admin.supervisors.loadingAssignments')}</span>
                            </div>
                        ) : assignments.length === 0 ? (
                            <div className="p-16 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users size={28} className="text-gray-300" />
                                </div>
                                <h3 className="font-bold text-gray-600 mb-1">{t('admin.supervisors.noAssignments')}</h3>
                                <p className="text-gray-400 text-sm">{t('admin.supervisors.noAssignmentsDetail')}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">{t('admin.supervisors.colSupervisor')}</th>
                                            <th className="px-6 py-4 font-bold">{t('admin.supervisors.colType')}</th>
                                            <th className="px-6 py-4 font-bold">{t('admin.supervisors.colValue')}</th>
                                            <th className="px-6 py-4 font-bold text-center">{t('admin.supervisors.colActions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {assignments.map(a => (
                                            <tr key={a.id} className="hover:bg-orange-50/30 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-900">{a.user?.name || a.user?.email}</td>
                                                <td className="px-6 py-4">
                                                    {a.assignment_type === 'all' && <span className="text-purple-700 bg-purple-100 px-2.5 py-1 font-semibold text-xs rounded-md shadow-sm">{t('admin.supervisors.typeAll_badge')}</span>}
                                                    {a.assignment_type === 'class' && <span className="text-blue-700 bg-blue-100 px-2.5 py-1 font-semibold text-xs rounded-md shadow-sm flex items-center gap-1.5 w-fit"><Building size={12} /> {t('admin.supervisors.typeClass_badge')}</span>}
                                                    {a.assignment_type === 'subject' && <span className="text-green-700 bg-green-100 px-2.5 py-1 font-semibold text-xs rounded-md shadow-sm flex items-center gap-1.5 w-fit"><BookOpen size={12} /> {t('admin.supervisors.typeSubject_badge')}</span>}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-600">{a.assignment_value || '—'}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleDelete(a.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shadow-sm bg-white border border-transparent hover:border-red-100" title="Supprimer l'affectation">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default SupervisorAssignmentsPage;
