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
            <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto" dir="ltr">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Enregistrement des Présences</h2>
                    <p className="text-sm text-gray-500">Recherchez un professeur pour enregistrer sa présence ou son absence pour la session en cours.</p>
                </div>

                <SearchBar
                    value={query}
                    onChange={setQuery}
                    placeholder="Rechercher par nom de professeur..."
                />

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    {isSearching ? (
                        <div className="flex justify-center p-8 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <Loading text="Recherche en cours..." />
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
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Aucun Résultat</h3>
                            <p className="text-gray-500 text-sm">Aucune session trouvée pour "{query}"</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                            <div className="bg-orange-50 p-4 rounded-full mb-4">
                                <Users className="h-10 w-10 text-orange-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Commencer la Recherche</h3>
                            <p className="text-gray-500 text-sm">Saisissez le nom du professeur dans la barre de recherche ci-dessus.</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default SupervisorPage;
