import { Layout } from '../../../shared/components/layout/Layout';
import SearchBar from '../components/SearchBar';
import ScheduleCard from '../components/ScheduleCard';
import { useScheduleSearch } from '../hooks/useScheduleSearch';
import { useAttendance } from '../hooks/useAttendance';
import { Users, FileX } from 'lucide-react';
import Loading from '../../../shared/components/ui/Loading';

export const SupervisorPage = () => {
    const { query, setQuery, results, setResults, isSearching, error } = useScheduleSearch();
    const { markAttendance, loadingId } = useAttendance();

    const handleMarkAttendance = async (scheduleId: string, status: 'present' | 'absent') => {
        const { success, schedule } = await markAttendance(scheduleId, status);

        // Optimistic UI update
        if (success && schedule) {
            setResults(prevResults =>
                prevResults.map(s => s.id === scheduleId ? { ...s, ...schedule } : s)
            );
        }
    };

    return (
        <Layout>
            <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">تسجيل الحضور</h2>
                    <p className="text-sm text-gray-500">ابحث عن الأستاذ لتسجيل حضوره أو غيابه للحصة الحالية.</p>
                </div>

                <SearchBar
                    value={query}
                    onChange={setQuery}
                    placeholder="ابحث باسم الأستاذ..."
                />

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    {isSearching ? (
                        <div className="flex justify-center p-8 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <Loading text="جاري البحث..." />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid gap-4">
                            {results.map((schedule) => (
                                <ScheduleCard
                                    key={schedule.id}
                                    schedule={schedule}
                                    onMark={handleMarkAttendance}
                                    loadingId={loadingId}
                                />
                            ))}
                        </div>
                    ) : query ? (
                        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                            <div className="bg-gray-50 p-4 rounded-full mb-4">
                                <FileX className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">لا توجد نتائج</h3>
                            <p className="text-gray-500 text-sm">لم يتم العثور على حصص تطابق بحثك "{query}"</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                            <div className="bg-blue-50 p-4 rounded-full mb-4">
                                <Users className="h-10 w-10 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">ابدأ البحث</h3>
                            <p className="text-gray-500 text-sm">اكتب اسم الأستاذ في صندوق البحث أعلاه لعرض الجدول الخاص به.</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default SupervisorPage;
