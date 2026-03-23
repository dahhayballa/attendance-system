import React, { useState, useEffect } from 'react';
import { Layout } from '../../../shared/components/layout/Layout';
import { supervisorAssignmentsService, SupervisorAssignment } from '../../../services/supabase/supervisor-assignments.service';
import Card from '../../../shared/components/ui/Card';
import Button from '../../../shared/components/ui/Button';
import { useToast } from '../../../shared/hooks/useToast';
import { Plus, Trash2, Users, Building, BookOpen } from 'lucide-react';
import Loading from '../../../shared/components/ui/Loading';

export const SupervisorAssignmentsPage = () => {
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
            toast.error("فشل تحميل البيانات");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supervisorId) return toast.error("يجب اختيار مشرف");
        if (type !== 'all' && !value) return toast.error("يجب إدخال القسم أو المادة");

        setIsSubmitting(true);
        try {
            await supervisorAssignmentsService.createAssignment({
                supervisor_id: supervisorId,
                assignment_type: type,
                assignment_value: type === 'all' ? null : value
            });
            toast.success("تم التعيين بنجاح");

            // Reset form
            setSupervisorId('');
            setType('all');
            setValue('');

            // Reload
            loadData();
        } catch (err) {
            toast.error("فشل التعيين (ربما هذا التعيين موجود مسبقاً)");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا التعيين؟")) return;
        try {
            await supervisorAssignmentsService.deleteAssignment(id);
            toast.success("تم الحذف بنجاح");
            loadData();
        } catch (err) {
            toast.error("فشل الحذف");
        }
    };

    return (
        <Layout>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">إدارة المشرفين</h2>
                        <p className="text-sm text-gray-500 mt-1">تعيين الأجنحة والأقسام للمشرفين</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* فورم الإضافة */}
                    <Card className="lg:col-span-1 border-t-4 border-blue-500 shadow-sm" padding="p-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Plus size={18} className="text-blue-500" />
                            تعيين جديد
                        </h3>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">المشرف</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                    value={supervisorId}
                                    onChange={(e) => setSupervisorId(e.target.value)}
                                    required
                                >
                                    <option value="">-- اختر المشرف --</option>
                                    {supervisors.map(s => (
                                        <option key={s.id} value={s.id}>{s.name || s.email}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">نوع التعيين</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                >
                                    <option value="all">كل الحصص بالمؤسسة</option>
                                    <option value="class">قسم محدد (جناح)</option>
                                    <option value="subject">مادة محددة</option>
                                </select>
                            </div>

                            {type !== 'all' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {type === 'class' ? 'اسم القسم (مثال: 1BTSMEC A)' : 'اسم المادة (مثال: Math)'}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                        placeholder="اكتب هنا..."
                                        required
                                    />
                                </div>
                            )}

                            <Button type="submit" fullWidth loading={isSubmitting} className="mt-2">
                                إضافة التعيين
                            </Button>
                        </form>
                    </Card>

                    {/* قائمة التعيينات */}
                    <Card className="lg:col-span-2 shadow-sm" padding="p-0">
                        <div className="p-4 border-b bg-gray-50 font-bold text-gray-700 flex items-center gap-2">
                            <Users size={18} className="text-gray-500" />
                            التعيينات الحالية
                        </div>

                        {loading ? (
                            <div className="p-8 text-center flex justify-center"><Loading /></div>
                        ) : assignments.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">لا توجد تعيينات حالياً. المؤسسة مفتوحة للجميع.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-sm">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                        <tr>
                                            <th className="px-6 py-3">المشرف</th>
                                            <th className="px-6 py-3">النوع</th>
                                            <th className="px-6 py-3">القيمة</th>
                                            <th className="px-6 py-3 text-center">إجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {assignments.map(a => (
                                            <tr key={a.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-bold text-gray-800">{a.user?.name || a.user?.email}</td>
                                                <td className="px-6 py-4">
                                                    {a.assignment_type === 'all' && <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded">الكل</span>}
                                                    {a.assignment_type === 'class' && <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1 w-fit"><Building size={14} /> قسم</span>}
                                                    {a.assignment_type === 'subject' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1 w-fit"><BookOpen size={14} /> مادة</span>}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-600" dir="ltr">{a.assignment_value || '—'}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleDelete(a.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
