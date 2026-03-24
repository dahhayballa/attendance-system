import Card from '../../../shared/components/ui/Card';
import { formatDate, formatTime } from '../../../shared/utils/formatters';
import Badge from '../../../shared/components/ui/Badge';
import { AttendanceLog } from '../../../types';

export interface ActivityLogProps {
    logs: AttendanceLog[];
    loading: boolean;
}

export const ActivityLog = ({ logs, loading }: ActivityLogProps) => {
    if (loading) {
        return (
            <Card header={<h3 className="text-lg font-bold text-gray-900 pb-2">Activité Récente</h3>}>
                <div className="animate-pulse space-y-4" dir="ltr">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex gap-4">
                            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card header={<h3 className="text-lg font-bold text-gray-900 pb-2">Activité Récente</h3>} padding="p-0">
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto" dir="ltr">
                {logs && logs.length > 0 ? logs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-orange-50/50 transition-colors flex items-start gap-4">
                        <div className="bg-orange-100 text-orange-600 p-2 rounded-full mt-1 flex-shrink-0 w-10 h-10 flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold">{(log.user_name?.[0] || 'S').toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-gray-900 text-sm truncate pr-2">
                                    {log.user_name} <span className="text-gray-500 font-normal">a enregistré une présence</span>
                                </p>
                                <div className="text-xs font-mono font-bold text-gray-400 flex-shrink-0">
                                    {formatTime(log.created_at)}
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 truncate">
                                <span className="font-semibold text-gray-800">{log.teacher_name}</span> <span className="text-gray-400">—</span> {log.subject}
                            </p>
                            <div className="flex items-center gap-2">
                                <Badge variant={log.status}>{log.status === 'present' ? 'Présent' : log.status === 'absent' ? 'Absent' : log.status === 'late' ? 'Retard' : 'Motif'}</Badge>
                                <span className="text-xs text-gray-400 ml-auto">{formatDate(log.created_at)}</span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="p-8 text-center text-gray-500 text-sm font-medium">
                        Aucune activité enregistrée récemment
                    </div>
                )}
            </div>
            {logs && logs.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-b-xl text-center border-t border-gray-100" dir="ltr">
                    <button className="text-sm font-bold text-orange-600 hover:text-orange-700 focus:outline-none transition-colors">
                        Voir tout l'historique
                    </button>
                </div>
            )}
        </Card>
    );
};

export default ActivityLog;
